/**
 * app/api/analyze/route.ts
 *
 * POST /api/analyze
 *
 * Server-side only. All API keys stay here — never exposed to the browser.
 *
 * Flow:
 *  1. Auth check (Supabase session cookie)
 *  2. Rate limit (per-user + per-IP, thresholds from env)
 *  3. Input validation (min 50 chars of review text, max 50 000 chars)
 *  4. Credit check (profiles.reports_used < profiles.reports_limit)
 *  5. Pass raw pasted text directly to Groq AI analysis
 *  6. Save to analyses table
 *  7. Deduct 1 credit (only on success)
 *  8. Return structured JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase-clerk';
import { analyzeReviews }            from '@/lib/groq';
import { analyzeRatelimit, publicRatelimit, getIP, rateLimitHeaders } from '@/lib/rate-limit';

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Auth check ─────────────────────────────────────────────────────────────
  const { userId, getToken } = await auth();
  const token = await getToken({ template: 'supabase' });
  const supabase = createClerkSupabaseClient(token);
  const user = userId ? { id: userId } : null;
  const authError = !userId;

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in.' },
      { status: 401 }
    );
  }

  // ── 2. Rate limiting ──────────────────────────────────────────────────────────
  //   Primary:   per authenticated user ID (prevent one account from abusing Groq)
  //   Secondary: per IP (prevent throwaway-account loops)
  try {
    const userResult = await analyzeRatelimit.limit(user.id);
    if (!userResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429, headers: rateLimitHeaders(userResult) }
      );
    }

    const ip = getIP(req);
    const ipResult = await publicRatelimit.limit(`analyze:ip:${ip}`);
    if (!ipResult.success) {
      return NextResponse.json(
        { error: 'Too many requests from this network. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(ipResult) }
      );
    }
  } catch (err) {
    // If Upstash is unreachable, fail open so Redis outages don't break the product.
    console.error('[analyze] Rate limiting error:', err);
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────────
  let input: string;
  try {
    const body = await req.json() as { input?: string };
    input = (body.input ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!input) {
    return NextResponse.json({ error: 'Input is required.' }, { status: 400 });
  }

  // ── 4. Input length validation & truncation ──────────────────────────────────
  if (input.length < 50) {
    return NextResponse.json(
      { error: 'Please paste more review content for accurate analysis — a few reviews works best.' },
      { status: 400 }
    );
  }

  const MAX_INPUT = 50_000;
  if (input.length > MAX_INPUT) {
    return NextResponse.json(
      { error: `Input is too long. Please paste fewer than ${MAX_INPUT.toLocaleString()} characters.` },
      { status: 400 }
    );
  }

  const SAFE_TOKEN_LIMIT = 8000;
  let warningMessage: string | undefined;

  if (input.length > SAFE_TOKEN_LIMIT) {
    input = input.slice(0, SAFE_TOKEN_LIMIT);
    warningMessage = 'For best results, we analyzed the first portion of your input. For very large review sets, consider submitting in smaller batches.';
  }

  // ── 5. Credit check & deduction ───────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('reports_used, reports_limit')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[analyze] Error fetching profile:', profileError);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }

  const hasCredit = profile.reports_limit === -1 || profile.reports_used < profile.reports_limit;

  if (!hasCredit) {
    return NextResponse.json(
      {
        error: "You're out of credits — upgrade to continue analyzing products.",
        code: 'OUT_OF_CREDITS',
        used: profile.reports_used,
        limit: profile.reports_limit,
      },
      { status: 402 }
    );
  }

  // Deduct the credit manually
  if (profile.reports_limit !== -1) {
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ reports_used: profile.reports_used + 1 })
      .eq('id', user.id);

    if (deductError) {
      console.error('[analyze] Failed to deduct credit:', deductError);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  }

  // ── 6. Groq AI analysis — pass raw pasted text directly ───────────────────────
  console.log(`[analyze] Running Groq analysis for user=${user.id} on ${input.length} chars`);
  let result;
  try {
    result = await analyzeReviews(input);
  } catch (groqErr: unknown) {
    // REFUND CREDIT ON FAILURE
    if (profile.reports_limit !== -1) {
      await supabase
        .from('profiles')
        .update({ reports_used: profile.reports_used }) // Restore to original count
        .eq('id', user.id);
    }

    const internalMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
    console.error('[analyze] Groq error:', internalMsg);

    // Check for token / context length errors
    const isTokenLimit = internalMsg.toLowerCase().includes('context_length_exceeded') ||
                         internalMsg.toLowerCase().includes('too_many_tokens') ||
                         internalMsg.toLowerCase().includes('maximum context length');

    if (isTokenLimit) {
      return NextResponse.json(
        { error: 'This review set is too large to process at once. Please paste a smaller batch (under 150-200 reviews) for best results.' },
        { status: 400 }
      );
    }

    // Return a safe user-facing message; expose "high demand" hint only when
    // Groq itself signals that, so the user knows to retry.
    const isHighDemand = internalMsg.toLowerCase().includes('high demand') ||
                         internalMsg.toLowerCase().includes('rate_limit') ||
                         internalMsg.toLowerCase().includes('overloaded');

    if (isHighDemand) {
      return NextResponse.json(
        { error: 'The AI service is currently under high demand. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'AI analysis failed. Please try again.' },
      { status: 500 }
    );
  }

  // ── 7. Save to reports table ──────────────────────────────────────────────────
  const { data: reportRow, error: saveError } = await supabase
    .from('reports')
    .insert({
      user_id:      user.id,
      input_text:   input.slice(0, 500),
      report_data:  result,
      review_count: result.reviewCount,
      created_at:   new Date().toISOString(),
    })
    .select('id')
    .single();

  if (saveError) {
    // Non-fatal — analysis succeeded, just couldn't save history
    console.error('[analyze] Failed to save report row:', saveError.message);
  }

  // ── 8. Fetch updated profile for remaining credits calculation ─────────────────
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('reports_used, reports_limit')
    .eq('id', user.id)
    .single();

  // ── 9. Return result ──────────────────────────────────────────────────────────
  return NextResponse.json({
    ...result,
    reportId:         reportRow?.id ?? null,
    creditsRemaining: (updatedProfile && updatedProfile.reports_limit !== -1)
      ? updatedProfile.reports_limit - updatedProfile.reports_used
      : null,
    warning:          warningMessage,
  });
}

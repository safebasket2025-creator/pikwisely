/**
 * app/api/analyze/route.ts
 *
 * POST /api/analyze
 *
 * Server-side only. All API keys stay here — never exposed to the browser.
 *
 * Flow:
 *  1. Auth check (Supabase session cookie)
 *  2. Credit check (profiles.reports_used < profiles.reports_limit)
 *  3. Basic validation (min 50 chars of review text)
 *  4. Pass raw pasted text directly to Groq AI analysis
 *  5. Save to analyses table
 *  6. Deduct 1 credit (only on success)
 *  7. Return structured JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@/lib/supabase-server';
import { analyzeReviews }            from '@/lib/groq';

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Parse body ────────────────────────────────────────────────────────────
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

  // ── 2. Basic length validation ───────────────────────────────────────────────
  if (input.length < 50) {
    return NextResponse.json(
      { error: 'Please paste more review content for accurate analysis — a few reviews works best.' },
      { status: 400 }
    );
  }

  // ── 3. Auth check ────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in.' },
      { status: 401 }
    );
  }

  // ── 4. Credit check & deduction (Non-RPC fallback) ───────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('reports_used, reports_limit')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[analyze] Error fetching profile:', profileError);
    return NextResponse.json(
      { error: 'Internal server error while checking credits.' },
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
      return NextResponse.json({ error: 'Internal server error while updating credits.' }, { status: 500 });
    }
  }

  // ── 5. Groq AI analysis — pass raw pasted text directly ──────────────────────
  console.log(`[analyze] Running Groq analysis on ${input.length} chars of pasted text`);
  let result;
  try {
    result = await analyzeReviews(input);
  } catch (groqErr: unknown) {
    // REFUND CREDIT ON FAILURE
    // Since we are not using RPC, we manually decrement the used count
    if (profile.reports_limit !== -1) {
      await supabase
        .from('profiles')
        .update({ reports_used: profile.reports_used }) // Restore to original count
        .eq('id', user.id);
    }

    
    const msg = groqErr instanceof Error ? groqErr.message : 'AI analysis failed.';
    console.error('[analyze] Groq error:', msg);
    
    const status = msg.includes('high demand') ? 429 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  // ── 6. Save to reports table ────────────────────────────────────────────────
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

  // ── 7. Fetch updated profile for remaining credits calculation ────────────────
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('reports_used, reports_limit')
    .eq('id', user.id)
    .single();

  // ── 8. Return result ─────────────────────────────────────────────────────────
  return NextResponse.json({
    ...result,
    reportId:         reportRow?.id ?? null,
    creditsRemaining: (updatedProfile && updatedProfile.reports_limit !== -1) 
      ? updatedProfile.reports_limit - updatedProfile.reports_used 
      : null,
  });
}

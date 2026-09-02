import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase-clerk';
import { publicRatelimit, getIP, rateLimitHeaders } from '@/lib/rate-limit';

// ─── Allowed feedback categories ───────────────────────────────────────────────
const VALID_CATEGORIES = [
  'bug',
  'feature',
  'pricing',
  'ux',
  'other',
] as const;

// ─── Length limits ─────────────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH  = 2000;
const MAX_CATEGORY_LENGTH = 50;
const MAX_PAGE_URL_LENGTH = 500;

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting (per IP) ──────────────────────────────────────────────────
    const ip = getIP(request);
    try {
      const rlResult = await publicRatelimit.limit(`feedback:${ip}`);
      if (!rlResult.success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: rateLimitHeaders(rlResult) }
        );
      }
    } catch (err) {
      console.error('[feedback/general] Rate limit error:', err);
    }

    // ── Parse body ─────────────────────────────────────────────────────────────
    let body: { category?: unknown; message?: unknown; page_url?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { category, message, page_url } = body;

    // ── Input validation ───────────────────────────────────────────────────────
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json({ error: 'Category is required.' }, { status: 400 });
    }

    const normalizedCategory = category.trim().toLowerCase();

    // Validate against allowed enum — reject anything else outright
    if (
      normalizedCategory.length > MAX_CATEGORY_LENGTH ||
      !(VALID_CATEGORIES as readonly string[]).includes(normalizedCategory)
    ) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}.` },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    const pageUrl = typeof page_url === 'string'
      ? page_url.slice(0, MAX_PAGE_URL_LENGTH)
      : 'Unknown';

    // ── Get current user if logged in ──────────────────────────────────────────
    const { userId, getToken } = await auth();
    const clerkUser = await currentUser();
    const token = await getToken({ template: 'supabase' });
    const supabase = createClerkSupabaseClient(token);
    
    const user_id    = userId || null;
    const user_email = clerkUser?.emailAddresses?.[0]?.emailAddress || null;

    // ── Insert into general_feedback ───────────────────────────────────────────
    const { error } = await supabase
      .from('general_feedback')
      .insert({
        user_id,
        user_email,
        category:  normalizedCategory,
        message:   message.trim(),
        page_url:  pageUrl,
      });

    if (error) {
      console.error('[feedback/general] Error inserting feedback:', error);
      return NextResponse.json(
        { error: 'Failed to submit feedback. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[feedback/general] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

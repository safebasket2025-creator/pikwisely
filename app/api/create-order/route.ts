import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { serverEnv } from '@/lib/env';
import { publicRatelimit, getIP, rateLimitHeaders } from '@/lib/rate-limit';

const VALID_PLANS = ['starter', 'pro'] as const;
type ValidPlan = typeof VALID_PLANS[number];

// Amounts are server-authoritative — never trusted from the client.
const PLAN_AMOUNTS: Record<ValidPlan, number> = {
  starter: 49900,   // ₹499 in paise
  pro:     149900,  // ₹1499 in paise
};

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting (per IP) ──────────────────────────────────────────────────
    const ip = getIP(req);
    try {
      const { success, ...rlResult } = await publicRatelimit.limit(`create-order:${ip}`);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: rateLimitHeaders({ success, ...rlResult }) }
        );
      }
    } catch (err) {
      console.error('[create-order] Rate limit error:', err);
    }

    // ── Auth check — get userId from session, not from client body ──────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // ── Parse & validate body ──────────────────────────────────────────────────
    let body: { plan?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { plan } = body;

    if (!plan || typeof plan !== 'string') {
      return NextResponse.json({ error: 'A plan name is required.' }, { status: 400 });
    }

    const normalizedPlan = plan.trim().toLowerCase();
    if (!(VALID_PLANS as readonly string[]).includes(normalizedPlan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}.` },
        { status: 400 }
      );
    }

    const validPlan = normalizedPlan as ValidPlan;
    const amount = PLAN_AMOUNTS[validPlan]; // server-calculated, never from client

    // ── Create Razorpay order ───────────────────────────────────────────────────
    const receipt = `receipt_${Date.now()}`;
    const basicAuth = Buffer.from(
      `${serverEnv.RAZORPAY_KEY_ID}:${serverEnv.RAZORPAY_KEY_SECRET}`
    ).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: {
          user_id: user.id,   // from authenticated session — not client body
          plan:    validPlan,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[create-order] Razorpay error:', data);
      return NextResponse.json({ error: 'Failed to create payment order. Please try again.' }, { status: 502 });
    }

    console.log('[RAW_RAZORPAY_RESPONSE]', JSON.stringify(data, null, 2));
    return NextResponse.json({ order_id: data.id }, { status: 200 });
  } catch (error: unknown) {
    console.error('[create-order] Unhandled error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

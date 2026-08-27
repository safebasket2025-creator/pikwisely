import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';
import { adminRatelimit } from '@/lib/rate-limit';

const VALID_PLANS = ['free', 'starter', 'pro'] as const;
type ValidPlan = typeof VALID_PLANS[number];

export async function POST(req: NextRequest) {
  try {
    const supabaseSessionClient = await createClient();
    const { data: { session } } = await supabaseSessionClient.auth.getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(session.user.email.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Rate limiting ──────────────────────────────────────────────────────────
    try {
      const { success } = await adminRatelimit.limit(session.user.id);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
      }
    } catch (err) {
      console.error('[admin/override-plan] Rate limit error:', err);
    }

    // ── Parse & validate body ──────────────────────────────────────────────────
    const body = await req.json();
    const { email, newPlan } = body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'A valid target email address is required.' }, { status: 400 });
    }

    if (!newPlan || typeof newPlan !== 'string') {
      return NextResponse.json({ error: 'A plan name is required.' }, { status: 400 });
    }

    const normalizedPlan = newPlan.trim().toLowerCase();
    if (!(VALID_PLANS as readonly string[]).includes(normalizedPlan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}.` },
        { status: 400 }
      );
    }

    const validPlan = normalizedPlan as ValidPlan;

    // ── Admin Supabase client (uses serverEnv) ─────────────────────────────────
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, plan')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Credit limits are the source of truth here — stored server-side only
    const PLAN_LIMITS: Record<ValidPlan, number> = { free: 3, starter: 40, pro: 150 };
    const newLimit = PLAN_LIMITS[validPlan];

    // Workaround for DB `plan_tier` ENUM missing 'starter'
    // Frontend UI determines plan primarily by `reports_limit` anyway.
    const dbPlan = validPlan === 'starter' ? 'pro' : validPlan;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ plan: dbPlan, reports_limit: newLimit, reports_used: 0 })
      .eq('id', targetProfile.id);

    if (updateError) {
      console.error('[admin/override-plan] Failed to update profile:', updateError);
      throw new Error('Failed to update user plan.');
    }

    const { error: logError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_email:       session.user.email,
        target_user_email: email.trim().toLowerCase(),
        action_type:       'plan_override',
        old_plan:          targetProfile.plan || 'free',
        new_plan:          validPlan,
        reason:            'Manual override via Admin Dashboard',
      });

    if (logError) {
      console.error('[admin/override-plan] Failed to log admin action:', logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[admin/override-plan] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

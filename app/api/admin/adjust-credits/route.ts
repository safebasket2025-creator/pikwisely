import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';
import { adminRatelimit } from '@/lib/rate-limit';

// ─── Allowed bounds for credit adjustment ──────────────────────────────────────
const MAX_ADJUSTMENT = 1000;  // ±1 000 credits per operation
const MAX_REASON_LENGTH = 500;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(email.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Rate limiting ──────────────────────────────────────────────────────────
    try {
      const { success } = await adminRatelimit.limit(userId);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
      }
    } catch (err) {
      console.error('[admin/adjust-credits] Rate limit error:', err);
    }

    // ── Parse & validate body ──────────────────────────────────────────────────
    const body = await req.json();
    const { email: targetEmail, amount, reason } = body;

    // Email format
    if (!targetEmail || typeof targetEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail.trim())) {
      return NextResponse.json({ error: 'A valid target email address is required.' }, { status: 400 });
    }

    // Amount: must be a finite integer within allowed bounds, non-zero
    if (
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      !Number.isInteger(amount) ||
      amount === 0 ||
      Math.abs(amount) > MAX_ADJUSTMENT
    ) {
      return NextResponse.json(
        { error: `Amount must be a non-zero integer between -${MAX_ADJUSTMENT} and ${MAX_ADJUSTMENT}.` },
        { status: 400 }
      );
    }

    // Reason: required string, reasonable max length
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'A reason is required.' }, { status: 400 });
    }
    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `Reason must be ${MAX_REASON_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    // ── Admin Supabase client (uses serverEnv, not bare process.env) ───────────
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get target user
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, reports_limit')
      .eq('email', targetEmail.trim().toLowerCase())
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const currentLimit = targetProfile.reports_limit || 0;
    const newLimit = currentLimit + amount;

    // Prevent limit from going below zero
    if (newLimit < 0) {
      return NextResponse.json(
        { error: `Adjustment would result in a negative credit limit (${newLimit}). Reduce the amount.` },
        { status: 400 }
      );
    }

    // Update user credits
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ reports_limit: newLimit })
      .eq('id', targetProfile.id);

    if (updateError) {
      console.error('[admin/adjust-credits] Failed to update profile:', updateError);
      throw new Error('Failed to update profile credits.');
    }

    // Log the action
    const { error: logError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_email:       email,
        target_user_email: targetEmail.trim().toLowerCase(),
        action_type:       'credit_adjustment',
        amount_changed:    amount,
        reason:            reason.trim(),
      });

    if (logError) {
      console.error('[admin/adjust-credits] Failed to log admin action:', logError);
      // Non-fatal — the credit update succeeded
    }

    return NextResponse.json({ success: true, newLimit });
  } catch (error: unknown) {
    console.error('[admin/adjust-credits] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

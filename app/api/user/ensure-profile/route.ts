/**
 * POST /api/user/ensure-profile
 *
 * Self-healing profile creation endpoint.
 * Called by the client on first load if the user has no Supabase profile row.
 * This acts as a webhook fallback — if the Clerk user.created webhook failed for
 * any reason (missing secret, Vercel cold start, network error), this endpoint
 * guarantees the profile row is created on the user's first app visit.
 *
 * Uses the Supabase service-role client (bypasses RLS) so it can insert even
 * when the user row doesn't exist yet.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if profile already exists — if so, just return it (idempotent)
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan, reports_limit, reports_used')
    .eq('id', userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
  }

  // Profile missing — fetch user details from Clerk and create it
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Could not fetch user from Clerk' }, { status: 500 });
  }

  const email = user.emailAddresses?.[0]?.emailAddress ?? '';
  const full_name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

  // Check if a row exists for this email but with a different/old ID (relink case)
  const { data: byEmail } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan, reports_limit, reports_used')
    .eq('email', email)
    .maybeSingle();

  if (byEmail && byEmail.id !== userId) {
    // Old UUID row — update to current Clerk ID so the user keeps their credits
    console.log(`[ensure-profile] Relinking ${email}: old id=${byEmail.id} → new id=${userId}`);
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ id: userId })
      .eq('email', email);

    if (error) {
      console.error('[ensure-profile] Relink error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...byEmail, id: userId });
  }

  // Fresh new user — insert with Free plan defaults
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name,
      plan: 'free',
      reports_limit: 3,
      reports_used: 0,
    })
    .select('id, email, plan, reports_limit, reports_used')
    .single();

  if (error) {
    console.error('[ensure-profile] Insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[ensure-profile] Created profile for ${userId} (${email})`);
  return NextResponse.json(data);
}

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';
import { adminRatelimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
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
      console.error('[admin/users] Rate limit error:', err);
    }

    // ── Admin Supabase client (uses serverEnv) ─────────────────────────────────
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, plan, reports_used, reports_limit, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      // Log the full error server-side; return a generic message to the client.
      console.error('[admin/users] Failed to fetch profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
    }

    return NextResponse.json({ profiles });
  } catch (error: unknown) {
    console.error('[admin/users] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
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

    const { email, amount, reason } = await req.json();

    if (!email || typeof amount !== 'number' || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role client to bypass RLS for administrative actions
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get target user
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, reports_limit')
      .eq('email', email.toLowerCase())
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentLimit = targetProfile.reports_limit || 0;
    const newLimit = currentLimit + amount;

    // Update user credits
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ reports_limit: newLimit })
      .eq('id', targetProfile.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    // Log the action
    const { error: logError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_email: session.user.email,
        target_user_email: email,
        action_type: 'credit_adjustment',
        amount_changed: amount,
        reason: reason
      });

    if (logError) {
      console.error('Failed to log admin action:', logError);
      // We don't fail the request here, but log it
    }

    return NextResponse.json({ success: true, newLimit });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

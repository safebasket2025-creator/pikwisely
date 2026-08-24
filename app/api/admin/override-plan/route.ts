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

    const { email, newPlan } = await req.json();

    if (!email || !newPlan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validPlans = ['free', 'starter', 'pro'];
    if (!validPlans.includes(newPlan.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, plan')
      .eq('email', email.toLowerCase())
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let newLimit = 3;
    if (newPlan.toLowerCase() === 'starter') newLimit = 40;
    if (newPlan.toLowerCase() === 'pro') newLimit = 150;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ plan: newPlan.toLowerCase(), reports_limit: newLimit, reports_used: 0 })
      .eq('id', targetProfile.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    const { error: logError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_email: session.user.email,
        target_user_email: email,
        action_type: 'plan_override',
        old_plan: targetProfile.plan || 'free',
        new_plan: newPlan.toLowerCase(),
        reason: 'Manual override via Admin Dashboard'
      });

    if (logError) {
      console.error('Failed to log admin action:', logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

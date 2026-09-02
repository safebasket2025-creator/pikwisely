import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase-clerk';

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }
    const token = await getToken({ template: 'supabase' });
    const supabase = createClerkSupabaseClient(token);
    const user = { id: userId };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('reports_limit')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found.' },
        { status: 404 }
      );
    }

    // reports_limit === 3 is the Free plan
    if (profile.reports_limit === 3) {
      return NextResponse.json(
        { error: 'Free plan users cannot download reports as PDF. Please upgrade to Starter or Pro.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[verify-pdf] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase-clerk';

export async function POST() {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('profiles')
      .update({ notified_plan_expiry: false })
      .eq('id', userId);

    if (error) {
      console.error('Error dismissing expiry banner:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in dismiss-expiry API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

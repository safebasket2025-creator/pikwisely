import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ notified_plan_expiry: false })
      .eq('id', session.user.id);

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

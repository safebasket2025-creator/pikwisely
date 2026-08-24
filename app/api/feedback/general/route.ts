import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { category, message, page_url } = body;

    if (!category || !message) {
      return NextResponse.json(
        { error: 'Category and message are required' },
        { status: 400 }
      );
    }

    // Get current user if logged in
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id || null;
    const user_email = session?.user?.email || null;

    // Insert into general_feedback
    const { error } = await supabase
      .from('general_feedback')
      .insert({
        user_id,
        user_email,
        category,
        message,
        page_url: page_url || 'Unknown',
      });

    if (error) {
      console.error('Error inserting general feedback:', error);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error submitting general feedback:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

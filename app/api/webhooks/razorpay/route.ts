import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = serverEnv.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log('Received valid Razorpay Webhook:', event.event);

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    if (event.event === 'payment.captured' || event.event === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      
      if (!paymentEntity) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }

      const notes = paymentEntity.notes || {};
      const userId = notes.user_id;
      const plan = notes.plan;
      const amount = paymentEntity.amount ? paymentEntity.amount / 100 : 0; // Assuming amount is in paise
      const paymentId = paymentEntity.id;
      
      if (!userId) {
         console.error('No user_id found in payment notes');
         return NextResponse.json({ error: 'Missing user_id in notes' }, { status: 400 });
      }

      // Fetch user profile to get email for payments table and current data
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      const userEmail = profile?.email || null;

      if (event.event === 'payment.captured') {
        // Set credits based on plan
        let credits = 3; // Default fallback
        if (plan === 'starter') credits = 40;
        if (plan === 'pro') credits = 150;
        
        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setDate(now.getDate() + 30);
        
        // Update user's profile
        // Workaround: Database enum plan_tier is missing 'starter', map to 'pro'
        const dbPlan = plan === 'starter' ? 'pro' : plan;

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            plan: dbPlan,
            reports_limit: credits,
            reports_used: 0,
            plan_purchased_date: now.toISOString(),
            plan_expiry_date: expiryDate.toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating user profile:', updateError);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        
        // Insert success payment record
        await supabaseAdmin.from('payments').insert({
          user_id: userId,
          user_email: userEmail,
          amount: amount,
          plan: plan,
          status: 'success',
          razorpay_payment_id: paymentId,
          created_at: now.toISOString()
        });
        
      } else if (event.event === 'payment.failed') {
        // Insert failed payment record
        await supabaseAdmin.from('payments').insert({
          user_id: userId,
          user_email: userEmail,
          amount: amount,
          plan: plan,
          status: 'failed',
          razorpay_payment_id: paymentId,
          created_at: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

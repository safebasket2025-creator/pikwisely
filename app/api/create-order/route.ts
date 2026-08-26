import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, userId } = body;

    if (!plan || !userId) {
      return NextResponse.json({ error: 'Missing plan or userId' }, { status: 400 });
    }

    let amount = 0;
    if (plan === 'starter') {
      amount = 49900; // ₹499 in paise
    } else if (plan === 'pro') {
      amount = 149900; // ₹1499 in paise
    } else {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const receipt = `receipt_${Date.now()}`;
    const basicAuth = Buffer.from(`${serverEnv.RAZORPAY_KEY_ID}:${serverEnv.RAZORPAY_KEY_SECRET}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: {
          user_id: userId,
          plan: plan,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay Error:', data);
      return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: response.status });
    }

    return NextResponse.json({ order_id: data.id }, { status: 200 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

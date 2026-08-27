import { serverEnv } from './lib/env';

async function testOrder() {
  const basicAuth = Buffer.from(
    `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: 49900,
      currency: 'INR',
      receipt: 'test_receipt',
      offers: []
    }),
  });

  const data = await response.json();
  console.log(response.status, data);
}

testOrder();

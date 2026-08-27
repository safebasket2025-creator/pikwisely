import { serverEnv } from './lib/env';

async function listOffers() {
  const basicAuth = Buffer.from(
    `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/offers', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
    }
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

listOffers();

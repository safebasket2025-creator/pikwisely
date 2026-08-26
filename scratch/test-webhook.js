const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
const env = {};
for (const line of envLines) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...val] = line.split('=');
    env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  }
}

async function testWebhook() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get a user to test with
  const { data: users, error: uErr } = await supabase.from('profiles').select('*').limit(1);
  if (uErr || !users.length) {
    console.error('No users found to test with', uErr);
    return;
  }
  const user = users[0];
  console.log(`Testing with user: ${user.email} (${user.id})`);

  // Webhook payload
  const payload = {
    entity: "event",
    account_id: "acc_123456",
    event: "payment.captured",
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: `pay_test_${Date.now()}`,
          entity: "payment",
          amount: 4900, // 49.00 INR
          currency: "INR",
          status: "captured",
          notes: {
            user_id: user.id,
            plan: "pro"
          }
        }
      }
    },
    created_at: Math.floor(Date.now() / 1000)
  };

  const rawBody = JSON.stringify(payload);
  const secret = env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
     console.error('No RAZORPAY_WEBHOOK_SECRET found in .env.local');
     return;
  }

  // Sign the payload
  const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  // Send request
  console.log('Sending webhook request...');
  const res = await fetch('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature
    },
    body: rawBody
  });

  console.log('Response status:', res.status);
  console.log('Response body:', await res.text());

  // Verify database
  console.log('Checking database updates...');
  
  const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  console.log('Updated Profile Plan:', updatedProfile.plan);
  console.log('Updated Profile Credits:', updatedProfile.reports_limit);
  console.log('Updated Profile Purchase Date:', updatedProfile.plan_purchased_date);
  console.log('Updated Profile Expiry Date:', updatedProfile.plan_expiry_date);
  
  const { data: payments } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
  console.log('Latest Payment Record:', payments[0]);
}

testWebhook().catch(console.error);

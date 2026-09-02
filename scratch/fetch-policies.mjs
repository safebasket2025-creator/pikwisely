import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

async function fetchPolicies() {
  // Use Supabase Management REST API /pg/policies endpoint
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/policies`, {
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.log('Management API failed:', res.status, text);
    return null;
  }
  return res.json();
}

async function checkRequestingUserIdFn() {
  // Try to call requesting_user_id() via rpc to see if it exists
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/requesting_user_id`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  });

  const text = await res.text();
  console.log('requesting_user_id() RPC status:', res.status);
  console.log('Response:', text);
}

async function main() {
  console.log('--- Checking requesting_user_id() function exists ---');
  await checkRequestingUserIdFn();

  console.log('\n--- Fetching policies via Management API ---');
  const policies = await fetchPolicies();
  if (policies) {
    const relevant = policies.filter(p =>
      ['profiles', 'reports', 'payments', 'report_feedback', 'general_feedback'].includes(p.table)
    );
    console.log(`Found ${relevant.length} relevant policies:`);
    relevant.forEach(p => {
      console.log(`\n[${p.table}] "${p.name}" (${p.command})`);
      console.log(`  USING: ${p.definition}`);
      if (p.check) console.log(`  WITH CHECK: ${p.check}`);
    });
  }
}

main();

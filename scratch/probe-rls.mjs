/**
 * Probes the current RLS policies by checking what the Supabase anon client sees
 * when authenticated with a real Clerk token vs the service role.
 * We compare service_role results vs anon-key results to reveal if RLS is blocking.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Known Clerk user ID for admin account (from diagnose.mjs earlier)
const adminClerkId = 'user_3Iif9I63vIIbxMiIalWdpty3z1J';

async function main() {
  // 1. Service role — bypasses RLS entirely
  const adminClient = createClient(url, serviceKey);
  const { data: adminData, error: adminErr } = await adminClient
    .from('profiles')
    .select('id, email, reports_limit')
    .eq('id', adminClerkId)
    .single();

  console.log('--- SERVICE ROLE (no RLS) ---');
  if (adminErr) console.error('Error:', adminErr.message);
  else console.log('Row found:', adminData);

  // 2. Anon key with NO auth header — RLS should block
  const anonClient = createClient(url, anonKey);
  const { data: anonData, error: anonErr } = await anonClient
    .from('profiles')
    .select('id, email, reports_limit')
    .eq('id', adminClerkId)
    .single();

  console.log('\n--- ANON KEY (no JWT, RLS active) ---');
  if (anonErr) console.log('Error (expected):', anonErr.message);
  else console.log('Row found (unexpected):', anonData);

  // 3. Test requesting_user_id() function — if it returns 200+null, it exists
  // We already know it returns 200 with null (from previous run) when called with service key
  // Let's call it with an empty anon request to confirm it exists
  const uidRes = await fetch(`${url}/rest/v1/rpc/requesting_user_id`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json',
    },
    body: '{}'
  });
  const uidText = await uidRes.text();
  console.log('\n--- requesting_user_id() function status ---');
  console.log(`HTTP ${uidRes.status}: ${uidText}`);
  if (uidRes.status === 200) {
    console.log('✅ requesting_user_id() EXISTS in the database');
  } else {
    console.log('❌ requesting_user_id() is MISSING or errored');
  }
}

main();

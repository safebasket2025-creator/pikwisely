import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // ── 1. Check most recently created profile row ──────────────────────────────
  console.log('=== CHECK 1: Most recent profile row ===');
  const { data: latest, error: e1 } = await supabase
    .from('profiles')
    .select('id, email, plan, reports_limit, reports_used, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (e1) console.error('Error:', e1.message);
  else console.log(JSON.stringify(latest, null, 2));

  // ── 2. Try to get column defaults via pg_catalog RPC ────────────────────────
  // Supabase exposes pg_catalog via service-role in some versions
  console.log('\n=== CHECK 2: profiles column definitions via pg_catalog ===');
  const { data: pgCols, error: e2 } = await supabase
    .from('pg_catalog.pg_attribute')
    .select('*')
    .limit(1);
  if (e2) console.log('pg_catalog not accessible:', e2.message);

  // ── 3. Try a direct INSERT with ONLY id/email/full_name (no plan/limits) ────
  // to see what defaults the DB fills in — use a dummy clerk-style ID
  console.log('\n=== CHECK 3: Test INSERT with only id/email/full_name to probe DB defaults ===');
  const testId = 'user_TEST_DEFAULTS_CHECK_001';
  
  // First clean up any leftover test row
  await supabase.from('profiles').delete().eq('id', testId);

  const { data: inserted, error: e3 } = await supabase
    .from('profiles')
    .insert({ id: testId, email: 'defaults-test@example.com', full_name: 'Test Defaults' })
    .select('id, email, plan, reports_limit, reports_used, created_at')
    .single();

  if (e3) {
    console.error('INSERT failed:', e3.message, e3.details, e3.hint);
  } else {
    console.log('Inserted row with DB defaults:');
    console.log(JSON.stringify(inserted, null, 2));
    console.log('');
    console.log('→ reports_limit default =', inserted.reports_limit, inserted.reports_limit === null ? '⚠️  NULL — BUG!' : '✅');
    console.log('→ reports_used default  =', inserted.reports_used,  inserted.reports_used  === null ? '⚠️  NULL — BUG!' : '✅');
    console.log('→ plan default          =', inserted.plan,          inserted.plan          === null ? '⚠️  NULL — BUG!' : '✅');
  }

  // Clean up test row
  await supabase.from('profiles').delete().eq('id', testId);
  console.log('\n(Test row cleaned up)');

  // ── 4. Check most recent Clerk user from Clerk API ───────────────────────────
  console.log('\n=== CHECK 4: Most recent Clerk user + matching Supabase row ===');
  const clerkRes = await fetch('https://api.clerk.com/v1/users?limit=3&order_by=-created_at', {
    headers: { Authorization: 'Bearer ' + process.env.CLERK_SECRET_KEY }
  });
  const clerkUsers = await clerkRes.json();

  if (!Array.isArray(clerkUsers) || clerkUsers.length === 0) {
    console.log('No Clerk users returned.');
    return;
  }

  for (const u of clerkUsers) {
    const email = u.email_addresses?.[0]?.email_address ?? '(no email)';
    const created = new Date(u.created_at).toISOString();
    console.log(`\nClerk user: ${u.id} | ${email} | signed up: ${created}`);

    const { data: row } = await supabase
      .from('profiles')
      .select('id, email, plan, reports_limit, reports_used, created_at')
      .eq('id', u.id)
      .maybeSingle();

    if (row) {
      console.log('  ✅ Supabase row EXISTS:', JSON.stringify(row));
      if (row.reports_limit === null) console.log('  ⚠️  reports_limit IS NULL — webhook fired but DB default missing!');
      if (row.reports_used  === null) console.log('  ⚠️  reports_used IS NULL — webhook fired but DB default missing!');
    } else {
      console.log('  ❌ NO Supabase row — webhook did NOT fire or failed silently!');
    }
  }
}

run().catch(console.error);

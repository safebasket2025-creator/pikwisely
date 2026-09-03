import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const clerkSecret = process.env.CLERK_SECRET_KEY;
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('======================================================');
  console.log('INVESTIGATION: New Signup Bug — ' + new Date().toISOString());
  console.log('======================================================\n');

  // ── CHECK 0: Is CLERK_WEBHOOK_SECRET set? ─────────────────────────────────
  console.log('── CHECK 0: Environment variables ──────────────────');
  console.log('CLERK_WEBHOOK_SECRET set? ' + (webhookSecret ? 'YES (starts with: ' + webhookSecret.slice(0, 8) + '...)' : '⚠️  NO — MISSING FROM .env.local!'));
  console.log('CLERK_SECRET_KEY set?     ' + (clerkSecret ? 'YES' : 'NO'));
  console.log('SUPABASE_SERVICE_ROLE_KEY set? ' + (supabaseKey ? 'YES' : 'NO') + '\n');

  // ── CHECK 1: Most recent 5 profiles in Supabase ────────────────────────────
  console.log('── CHECK 1: Most recent 5 Supabase profiles (by created_at) ──');
  const { data: recentProfiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, reports_limit, reports_used, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (profileErr) {
    console.error('Error fetching profiles:', profileErr.message);
  } else if (!recentProfiles || recentProfiles.length === 0) {
    console.log('No profiles found in DB.');
  } else {
    recentProfiles.forEach(r => {
      const limitFlag = r.reports_limit === null ? ' ⚠️ NULL' : '';
      console.log(
        'id=' + (r.id ? r.id.slice(0, 24) + '...' : 'NULL') +
        ' | email=' + r.email +
        ' | plan=' + r.plan +
        ' | reports_limit=' + r.reports_limit + limitFlag +
        ' | reports_used=' + r.reports_used +
        ' | created_at=' + r.created_at
      );
    });
  }

  // ── CHECK 2: Column defaults via pg_catalog ────────────────────────────────
  console.log('\n── CHECK 2: Column defaults for profiles.reports_limit / reports_used ──');
  // Use Supabase's SQL editor endpoint via RPC if available, or note limitation
  // We'll try the information_schema approach (may be blocked by RLS on anon, but service role should work)
  const { data: rawCols, error: rawErr } = await supabase
    .from('information_schema.columns')
    .select('column_name, column_default, is_nullable')
    .eq('table_name', 'profiles')
    .eq('table_schema', 'public')
    .in('column_name', ['reports_limit', 'reports_used', 'plan']);

  if (rawErr) {
    console.log('information_schema not directly queryable via JS client: ' + rawErr.message);
    console.log('→ Check Supabase Dashboard > Table Editor > profiles columns manually.');
  } else {
    rawCols.forEach(c => {
      console.log('column=' + c.column_name + ' | default=' + c.column_default + ' | nullable=' + c.is_nullable);
    });
  }

  // ── CHECK 3: Most recent 3 Clerk users cross-referenced with Supabase ──────
  console.log('\n── CHECK 3: Most recent 3 Clerk users vs Supabase profiles ──');
  try {
    const res = await fetch('https://api.clerk.com/v1/users?limit=3&order_by=-created_at', {
      headers: { Authorization: 'Bearer ' + clerkSecret }
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Clerk API error:', res.status, txt);
    } else {
      const users = await res.json();
      if (!Array.isArray(users) || users.length === 0) {
        console.log('No users returned from Clerk.');
      } else {
        for (const u of users) {
          const email = u.email_addresses?.[0]?.email_address ?? '(no email)';
          const createdAt = new Date(u.created_at).toISOString();
          console.log('\n  Clerk user: ' + u.id + ' | ' + email + ' | created: ' + createdAt);

          const { data: byId } = await supabase.from('profiles').select('id, email, reports_limit, reports_used').eq('id', u.id).maybeSingle();
          const { data: byEmail } = await supabase.from('profiles').select('id, email, reports_limit, reports_used').eq('email', email).maybeSingle();

          if (byId) {
            console.log('    ✅ Supabase row found by Clerk ID: reports_limit=' + byId.reports_limit + ', reports_used=' + byId.reports_used);
          } else if (byEmail) {
            console.log('    ⚠️  Row by EMAIL but NOT by Clerk ID — ID mismatch!');
            console.log('       Supabase row ID=' + byEmail.id + ' (expected Clerk ID=' + u.id + ')');
            console.log('       reports_limit=' + byEmail.reports_limit + ', reports_used=' + byEmail.reports_used);
          } else {
            console.log('    ❌ NO Supabase profile row found (neither by Clerk ID nor email)!');
          }
        }
      }
    }
  } catch (e) {
    console.error('Error calling Clerk API:', e.message);
  }

  console.log('\n======================================================');
  console.log('DONE');
  console.log('======================================================');
}

run().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const clerkSecret = process.env.CLERK_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = 'safebasket2025@gmail.com';

async function diagnose() {
  console.log('--- 1. Clerk User ---');
  try {
    const res = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(targetEmail)}`, {
      headers: {
        Authorization: `Bearer ${clerkSecret}`
      }
    });
    const users = await res.json();
    if (users.length > 0) {
      const u = users[0];
      console.log(`Clerk ID (internal): ${u.id}`);
      console.log(`Clerk External ID: ${u.external_id}`);
      console.log(`Clerk Public Metadata:`, u.public_metadata);
    } else {
      console.log('User not found in Clerk.');
    }
  } catch (e) {
    console.error('Error fetching Clerk user:', e.message);
  }

  console.log('\n--- 2. Supabase Profile ---');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', targetEmail);

    if (error) {
      console.error('Error fetching Supabase profile:', error.message);
    } else {
      console.log(`Rows found: ${data.length}`);
      data.forEach(row => {
        console.log(`Row: id=${row.id}, email=${row.email}, plan_name=${row.plan_name}, reports_limit=${row.reports_limit}, reports_used=${row.reports_used}`);
      });
    }
  } catch (e) {
    console.error('Error fetching Supabase profile:', e.message);
  }
}

diagnose();

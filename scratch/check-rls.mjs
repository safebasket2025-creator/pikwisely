import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRLS() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Removed rpc call
  // Actually, we can just query pg_policies using the admin key if it has access
  const { data: policies, error: polErr } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'profiles');
    
  if (polErr) {
    console.error('Error fetching policies:', polErr.message);
  } else {
    console.log('Profiles RLS Policies:');
    console.table(policies);
  }
}

checkRLS();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) {
    env[key.trim()] = val.join('=').trim().replace(/"/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchPolicies() {
  // Query the pg_policies view using the REST API (if exposed) or via an RPC call.
  // Wait, Supabase REST API doesn't expose pg_policies by default.
  // We can try to use a direct postgres connection string if available, but we might only have SUPABASE_URL.
  // Is there a way to get policies?
  // We can try to run `supabase.rpc()` if there's a function. But there probably isn't.
  // Let's check if the REST API exposes pg_policies anyway.
  const { data, error } = await supabase.from('pg_policies').select('*').in('tablename', ['profiles', 'reports', 'payments', 'report_feedback', 'general_feedback']);
  
  if (error) {
    console.error("Error fetching policies (might not be exposed):", error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

fetchPolicies();

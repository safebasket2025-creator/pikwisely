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
const tables = ['profiles', 'reports', 'payments', 'report_feedback', 'general_feedback', 'admin_actions'];
Promise.all(tables.map(async (t) => {
  const { data, error } = await supabase.from(t).select('*').limit(1);
  console.log(t, data ? (data[0] ? Object.keys(data[0]) : 'empty table') : error.message);
})).then(() => process.exit());

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkSchema() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Use postgres introspection to get the column type of profiles.id
  const { data, error } = await supabase.rpc('query_schema').catch(() => ({}));
  
  // Alternative: try inserting a dummy text id and see if it fails UUID cast
  const { error: insertErr } = await supabase
    .from('profiles')
    .insert({ id: 'user_dummy_123', email: 'dummy@example.com' });
    
  if (insertErr) {
    console.log('Insert Error:', insertErr.message);
  } else {
    console.log('Insert succeeded (id is likely text).');
    await supabase.from('profiles').delete().eq('id', 'user_dummy_123');
  }
}

checkSchema();

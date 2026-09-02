import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkProfiles() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const emailsToCheck = [
    'safebasket2025@gmail.com',
    'workwithhemant007@gmail.com',
    'yash@gmail.com'
  ];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, reports_limit, reports_used')
    .in('email', emailsToCheck);

  if (error) {
    console.error('Error fetching profiles:', error.message);
  } else {
    console.log('Profiles found:');
    console.table(data);
  }
}

checkProfiles();

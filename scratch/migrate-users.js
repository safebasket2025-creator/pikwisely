// migrate-users.js
// Run this script locally using Node.js to migrate users from Supabase to Clerk.
// NOTE: You must install 'dotenv' (npm install dotenv) to run this locally, or pass the variables.

import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLERK_SECRET_KEY) {
  console.error("Missing environment variables. Please check your .env.local file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

async function migrateUsers() {
  console.log("Fetching users from Supabase...");
  let allUsers = [];
  let page = 1;
  const perPage = 1000;
  
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });
    
    if (error) {
      console.error("Error fetching users:", error);
      break;
    }
    
    if (!users || users.length === 0) break;
    
    allUsers = allUsers.concat(users);
    if (users.length < perPage) break;
    page++;
  }

  console.log(`Found ${allUsers.length} users. Starting migration to Clerk...`);

  let successCount = 0;
  let failCount = 0;

  for (const user of allUsers) {
    try {
      if (!user.email) {
        console.warn(`Skipping user ${user.id} (No email found)`);
        continue;
      }

      console.log(`Migrating user: ${user.email} (ID: ${user.id})`);

      // We set externalId to the original Supabase UUID.
      // This is crucial: Clerk will store this, and we can configure the Clerk JWT 
      // to pass it to Supabase so existing data still links up perfectly.
      await clerk.users.createUser({
        emailAddress: [user.email],
        externalId: user.id,
        skipPasswordRequirement: true // Used for passwordless/OAuth migration
      });
      successCount++;
    } catch (err) {
      // Check if the error is a duplicate email error
      const isDuplicate = err.errors?.some(e => e.code === 'form_identifier_exists');
      if (isDuplicate) {
        console.warn(`User ${user.email} already exists in Clerk. Safely skipped.`);
      } else {
        console.error(`Failed to migrate user ${user.email}:`, err.errors?.[0]?.message || err.message);
        failCount++;
      }
    }
  }

  console.log(`Migration complete. Successfully migrated: ${successCount}, Failed: ${failCount}`);
}

migrateUsers();

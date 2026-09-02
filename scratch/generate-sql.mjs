import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const clerkSecret = process.env.CLERK_SECRET_KEY;

async function generateSQL() {
  try {
    const res = await fetch(`https://api.clerk.com/v1/users?limit=100`, {
      headers: {
        Authorization: `Bearer ${clerkSecret}`
      }
    });
    const users = await res.json();
    
    // Filter to only users that were migrated (they have an external_id)
    const migratedUsers = users.filter(u => u.external_id);
    
    console.log(`Found ${migratedUsers.length} migrated users with external_ids.`);
    
    let sql = `-- Migration script to update old Supabase UUIDs to new Clerk IDs\n`;
    sql += `BEGIN;\n\n`;
    
    sql += `-- 1. Drop foreign key constraints so we can update the parent profile IDs\n`;
    sql += `ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;\n`;
    sql += `ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;\n`;
    sql += `ALTER TABLE report_feedback DROP CONSTRAINT IF EXISTS report_feedback_user_id_fkey;\n`;
    sql += `ALTER TABLE general_feedback DROP CONSTRAINT IF EXISTS general_feedback_user_id_fkey;\n\n`;

    sql += `-- 2. Perform the ID updates (hardcoded pairs)\n`;
    for (const u of migratedUsers) {
      const oldId = u.external_id;
      const newId = u.id;
      sql += `-- Updating user: ${u.email_addresses[0]?.email_address}\n`;
      sql += `UPDATE profiles SET id = '${newId}' WHERE id = '${oldId}';\n`;
      sql += `UPDATE reports SET user_id = '${newId}' WHERE user_id = '${oldId}';\n`;
      sql += `UPDATE payments SET user_id = '${newId}' WHERE user_id = '${oldId}';\n`;
      sql += `UPDATE report_feedback SET user_id = '${newId}' WHERE user_id = '${oldId}';\n`;
      sql += `UPDATE general_feedback SET user_id = '${newId}' WHERE user_id = '${oldId}';\n\n`;
    }

    sql += `-- 3. Re-add foreign key constraints\n`;
    sql += `ALTER TABLE reports ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;\n`;
    sql += `ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;\n`;
    sql += `ALTER TABLE report_feedback ADD CONSTRAINT report_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;\n`;
    sql += `ALTER TABLE general_feedback ADD CONSTRAINT general_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;\n\n`;
    
    sql += `COMMIT;\n`;

    import('fs').then(fs => {
      fs.writeFileSync('scratch/migration.sql', sql);
      console.log('SQL generated and saved to scratch/migration.sql');
    });

  } catch (e) {
    console.error('Error:', e.message);
  }
}

generateSQL();

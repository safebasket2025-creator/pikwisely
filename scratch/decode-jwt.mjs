/**
 * Decodes a Clerk JWT (base64) and prints the payload claims.
 * Paste a real token from the browser network tab (the Authorization: Bearer <token>
 * value from a /api/analyze or /api/ request).
 * 
 * Usage: node scratch/decode-jwt.mjs <token>
 */
const token = process.argv[2];

if (!token) {
  // If no token provided, create a test JWT from Clerk to show what it would look like
  console.log('Usage: node scratch/decode-jwt.mjs <jwt_token>');
  console.log('\nTo get a token: open browser DevTools → Network tab → find any /api/ request → copy the Authorization header value (without "Bearer ")');
  process.exit(0);
}

const parts = token.split('.');
if (parts.length !== 3) {
  console.error('Invalid JWT format');
  process.exit(1);
}

const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

console.log('--- JWT Header ---');
console.log(JSON.stringify(header, null, 2));

console.log('\n--- JWT Payload (claims) ---');
console.log(JSON.stringify(payload, null, 2));

console.log('\n--- Key Claims Summary ---');
console.log(`sub (subject):      "${payload.sub}"`);
console.log(`aud (audience):     "${payload.aud}"`);
console.log(`role:               "${payload.role}"`);
console.log(`email:              "${payload.email}"`);
console.log(`supabase_id:        "${payload.supabase_id ?? '(NOT PRESENT)'}"`);

if (payload.sub) {
  if (payload.sub.startsWith('user_')) {
    console.log('\n✅ sub = Clerk internal ID (user_...)');
  } else {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(payload.sub)) {
      console.log('\n⚠️  sub = UUID format (old Supabase-style ID, NOT the Clerk internal ID)');
    } else {
      console.log('\n❓ sub = unknown format');
    }
  }
}

if (payload.supabase_id) {
  console.log(`\n⚠️  supabase_id claim IS present: "${payload.supabase_id}"`);
  console.log('   requesting_user_id() likely reads this first via COALESCE');
} else {
  console.log('\nℹ️  supabase_id claim is NOT present in this token');
  console.log('   requesting_user_id() will fall back to reading sub');
}

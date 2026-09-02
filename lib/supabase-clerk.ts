import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client that authenticates using a Clerk JWT.
 * You should pass the Clerk Token obtained from `auth().getToken({ template: 'supabase' })`
 * on the server, or `useAuth().getToken({ template: 'supabase' })` on the client.
 */
export function createClerkSupabaseClient(clerkToken: string | null) {
  const options = clerkToken
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${clerkToken}`,
          },
        },
      }
    : {};

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
}

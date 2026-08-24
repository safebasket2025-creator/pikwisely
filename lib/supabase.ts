/**
 * lib/supabase.ts
 *
 * Browser-side Supabase client.
 * Safe to import from any Client Component ('use client').
 * Uses NEXT_PUBLIC_* env vars which are inlined at build time.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

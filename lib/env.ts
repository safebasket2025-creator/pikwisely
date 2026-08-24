/**
 * lib/env.ts
 *
 * Central environment variable validator for Pikwisely.
 *
 * Rules enforced here:
 *  - All required vars are checked at module load time; a missing var throws
 *    immediately with a clear message rather than failing silently at runtime.
 *  - Server-only keys are exported via `serverEnv`, which must NEVER be
 *    imported from client components or browser-side code.
 *  - Only NEXT_PUBLIC_* keys appear in `clientEnv`, which is safe to import
 *    anywhere (browser or server).
 *
 * Usage:
 *   // In an API route or server action:
 *   import { serverEnv } from '@/lib/env';
 *   const groq = new Groq({ apiKey: serverEnv.GROQ_API_KEY });
 *
 *   // In a client component or shared utility:
 *   import { clientEnv } from '@/lib/env';
 *   console.log(clientEnv.NEXT_PUBLIC_APP_NAME);
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Reads an env var and throws if it is absent or empty.
 * Use for required keys (server or client).
 */
function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `[Pikwisely] Missing required environment variable: "${key}"\n` +
      `  -> Check your .env.local file and make sure "${key}" is set.\n` +
      `  -> See .env.example for reference values.`
    );
  }
  return value.trim();
}

/**
 * Reads an env var and returns a fallback if it is absent.
 * Use for optional keys with sensible defaults.
 */
function optional(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

// ─── Guard: server-only env must not be evaluated in the browser ───────────────

const IS_SERVER = typeof window === 'undefined';

// ─── Server-only environment ──────────────────────────────────────────────────
//
// ONLY import `serverEnv` in:
//  - app/api/**/*.ts  (Next.js API routes)
//  - app/**/actions.ts  (Server Actions)
//  - lib/server/**/*.ts  (server-side utilities)
//
// Importing it in a Client Component will expose secrets to the browser bundle.

let _serverEnv: {
  SUPABASE_SERVICE_ROLE_KEY: string;
  GROQ_API_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
};

if (IS_SERVER) {
  _serverEnv = {
    // Supabase -- full admin access, bypasses Row Level Security
    SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),

    // Groq -- AI analysis requests
    GROQ_API_KEY: required('GROQ_API_KEY'),

    // Razorpay -- payment processing & webhook verification
    // Optional: these are not required until payments are enabled
    RAZORPAY_KEY_ID: optional('RAZORPAY_KEY_ID', ''),
    RAZORPAY_KEY_SECRET: optional('RAZORPAY_KEY_SECRET', ''),
    RAZORPAY_WEBHOOK_SECRET: optional('RAZORPAY_WEBHOOK_SECRET', ''),
  };
} else {
  // Provide a Proxy that throws a loud error if client code tries to access
  // server-only keys, instead of silently returning undefined.
  _serverEnv = new Proxy({} as typeof _serverEnv, {
    get(_target, prop: string) {
      throw new Error(
        `[Pikwisely] Attempted to access server-only env var "${prop}" in browser code.\n` +
        `  -> Move this code to an API route, Server Action, or server-side utility.\n` +
        `  -> Only NEXT_PUBLIC_* variables are accessible on the client.`
      );
    },
  });
}

export const serverEnv = _serverEnv;

// ─── Client-safe environment ──────────────────────────────────────────────────
//
// These NEXT_PUBLIC_* variables are inlined by Next.js at build time and are
// visible to the browser. Do NOT add any secret key here.

export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  NEXT_PUBLIC_APP_URL: optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: optional('NEXT_PUBLIC_APP_NAME', 'Pikwisely'),
} as const;

// ─── Type exports (useful for typed access in tests) ─────────────────────────

export type ServerEnv = typeof _serverEnv;
export type ClientEnv = typeof clientEnv;

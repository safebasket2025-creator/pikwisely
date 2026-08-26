/**
 * lib/rate-limit.ts
 *
 * Central Upstash rate-limiter factory for Pikwisely.
 *
 * All thresholds are configurable via environment variables so they can be
 * tuned per-environment without a code change.  Sensible defaults are
 * supplied so the app works out-of-the-box in development.
 *
 * Usage in an API route:
 *   import { analyzeRatelimit, publicRatelimit, adminRatelimit, getIP } from '@/lib/rate-limit';
 *
 *   const { success, limit, remaining, reset } = await analyzeRatelimit.limit(userId);
 *   if (!success) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
 *
 * Env vars (all optional — defaults shown):
 *   RATE_LIMIT_ANALYZE_REQUESTS=10
 *   RATE_LIMIT_ANALYZE_WINDOW=60s
 *   RATE_LIMIT_PUBLIC_REQUESTS=30
 *   RATE_LIMIT_PUBLIC_WINDOW=60s
 *   RATE_LIMIT_ADMIN_REQUESTS=60
 *   RATE_LIMIT_ADMIN_WINDOW=60s
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';
import { NextRequest } from 'next/server';

// ─── Shared Redis client ───────────────────────────────────────────────────────

const redis = Redis.fromEnv();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse an env var that is expected to be a positive integer.
 * Falls back to `defaultVal` if the var is absent or unparseable.
 */
function envInt(key: string, defaultVal: number): number {
  const raw = process.env[key];
  if (!raw) return defaultVal;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

/**
 * Parse an env var expected to be an Upstash duration string (e.g. "60 s", "10 m").
 * Falls back to `defaultVal` if absent.
 */
function envDuration(key: string, defaultVal: string): Parameters<typeof Ratelimit.slidingWindow>[1] {
  const raw = process.env[key];
  // Accept either "60s" or "60 s" — Upstash accepts both
  return (raw && raw.trim() !== '' ? raw.trim() : defaultVal) as Parameters<typeof Ratelimit.slidingWindow>[1];
}

// ─── Rate-limiter instances ────────────────────────────────────────────────────

/**
 * analyzeRatelimit
 * Applied per authenticated user ID on POST /api/analyze.
 * Protects against Groq API cost abuse.
 * Default: 10 requests per 60 seconds.
 */
export const analyzeRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    envInt('RATE_LIMIT_ANALYZE_REQUESTS', 10),
    envDuration('RATE_LIMIT_ANALYZE_WINDOW', '60 s'),
  ),
  analytics: true,
  prefix: 'rl:analyze',
});

/**
 * publicRatelimit
 * Applied per IP on public (unauthenticated) endpoints:
 *   - POST /api/create-order
 *   - POST /api/feedback/general
 * Default: 30 requests per 60 seconds.
 */
export const publicRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    envInt('RATE_LIMIT_PUBLIC_REQUESTS', 30),
    envDuration('RATE_LIMIT_PUBLIC_WINDOW', '60 s'),
  ),
  analytics: true,
  prefix: 'rl:public',
});

/**
 * adminRatelimit
 * Applied per authenticated admin user ID on /api/admin/* routes.
 * Looser than public — admins are trusted, but we still prevent runaway loops.
 * Default: 60 requests per 60 seconds.
 */
export const adminRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    envInt('RATE_LIMIT_ADMIN_REQUESTS', 60),
    envDuration('RATE_LIMIT_ADMIN_WINDOW', '60 s'),
  ),
  analytics: true,
  prefix: 'rl:admin',
});

// ─── IP extraction ─────────────────────────────────────────────────────────────

/**
 * Extract the client IP from a NextRequest, respecting common reverse-proxy
 * headers (Vercel, Cloudflare, etc.).  Falls back to "unknown" if none found.
 */
export function getIP(req: NextRequest): string {
  // Vercel/most CDNs set x-forwarded-for as a comma-separated list;
  // the first entry is the original client IP.
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();

  // Cloudflare
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();

  // Fly.io / Railway
  const flyIP = req.headers.get('fly-client-ip');
  if (flyIP) return flyIP.trim();

  return 'unknown';
}

// ─── Shared 429 response helper ───────────────────────────────────────────────

export interface RatelimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Build rate-limit response headers to attach to 429 responses.
 */
export function rateLimitHeaders(result: RatelimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit':     result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset':     result.reset.toString(),
    'Retry-After':           Math.ceil((result.reset - Date.now()) / 1000).toString(),
  };
}

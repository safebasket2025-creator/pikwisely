/**
 * lib/apify.ts
 *
 * Apify REST wrapper for Amazon review scraping.
 *
 * Actor: junglee/amazon-reviews-scraper
 *  - Input schema confirmed from a real successful Apify run.
 *  - Output field for review text: `reviewDescription`
 *  - Output field for product name: nested `product.name`
 *
 * Strategy:
 *  1. Resolve any short URL (amzn.in) to a full Amazon URL first.
 *  2. Sync run (fastest, returns inline).
 *  3. Async run + poll if sync times out.
 */

const APIFY_BASE    = 'https://api.apify.com/v2';
const MAX_REVIEWS   = 50;
const SYNC_TIMEOUT  = 120;     // seconds Apify waits in sync mode
const POLL_TIMEOUT  = 240_000; // 4 min async poll timeout
const POLL_INTERVAL = 6_000;   // poll every 6 seconds

export interface ApifyScrapeResult {
  reviews:     string[];
  productName: string;
  reviewCount: number;
  platform:    'amazon';
}

// ─── Actor definitions ───────────────────────────────────────────────────────────
interface ActorDef {
  id:         string;
  buildInput: (url: string) => Record<string, unknown>;
}

const ACTORS: ActorDef[] = [
  {
    // junglee/amazon-reviews-scraper
    // Input schema confirmed from a real successful run.
    id: 'junglee/amazon-reviews-scraper',
    buildInput: (url) => ({
      productUrls:                   [{ url }],
      maxReviews:                    MAX_REVIEWS,
      sort:                          'helpful',
      filterByRatings:               ['allStars'],
      deduplicateRedirectedAsins:    true,
      includeGdprSensitive:          false,
      reviewsAlwaysSaveCategoryData: false,
      reviewsUseProductVariantFilter: false,
      scrapeProductDetails:          false,
    }),
  },
];

// ─── Resolve short URL (amzn.in → full Amazon URL) ───────────────────────────
async function resolveShortUrl(url: string): Promise<string> {
  let current = url;
  for (let i = 0; i < 6; i++) {
    let res: Response;
    try {
      res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(8_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch {
      break;
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) break;
      current = location.startsWith('http') ? location : new URL(location, current).href;
      console.log(`[Apify] Redirect hop ${i + 1}: ${current}`);
      continue;
    }
    break;
  }
  return current;
}

// ─── Normalize URL to full Amazon product-reviews page ───────────────────────
function toReviewsUrl(url: string): string {
  if (url.includes('/product-reviews/')) return url;
  const asinMatch = url.match(/\/(?:dp|gp\/product|product-reviews)\/([A-Z0-9]{10})/i);
  if (asinMatch) {
    const base = url.match(/https?:\/\/[^/]+/)?.[0] ?? 'https://www.amazon.in';
    const asin = asinMatch[1];
    return `${base}/product-reviews/${asin}/?reviewerType=all_reviews&sortBy=recent`;
  }
  return url;
}

// ─── Extract review text from item ───────────────────────────────────────────
// junglee actor output field: reviewDescription
function extractReviewText(item: Record<string, unknown>): string {
  return (
    (item.reviewDescription as string) ||
    (item.reviewText        as string) ||
    (item.body              as string) ||
    (item.text              as string) ||
    (item.review            as string) ||
    (item.content           as string) ||
    (item.reviewBody        as string) ||
    (item.description       as string) ||
    ''
  );
}

// junglee actor output: product name lives in item.product.name or item.product.title
function extractProductName(item: Record<string, unknown>): string {
  const prod = item.product as Record<string, unknown> | undefined;
  return (
    (prod?.name        as string) ||
    (prod?.title       as string) ||
    (item.productName  as string) ||
    (item.productTitle as string) ||
    (item.title        as string) ||
    (item.name         as string) ||
    'Unknown Product'
  );
}

// ─── Parse raw dataset items ──────────────────────────────────────────────────
function parseItems(items: Record<string, unknown>[]): { reviews: string[]; productName: string } {
  console.log(`[Apify] Items received: ${items.length}`);
  if (items.length > 0) {
    console.log('[Apify] First item keys:', Object.keys(items[0]).join(', '));
    console.log('[Apify] First item sample:', JSON.stringify(items[0]).slice(0, 500));
  }

  const reviews = items
    .map(extractReviewText)
    .filter(t => t.trim().length > 10)
    .slice(0, MAX_REVIEWS);

  const productName = items.length > 0 ? extractProductName(items[0]) : 'Unknown Product';
  console.log(`[Apify] Extracted ${reviews.length} review texts`);
  return { reviews, productName };
}

// ─── Synchronous run ──────────────────────────────────────────────────────────
async function runSync(
  apiKey:     string,
  actorId:    string,
  actorInput: Record<string, unknown>
): Promise<Record<string, unknown>[] | null> {
  const endpoint =
    `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items` +
    `?token=${apiKey}&timeout=${SYNC_TIMEOUT}&memory=512`;

  console.log(`[Apify] Sync run | actor: ${actorId}`);
  console.log('[Apify] Input:', JSON.stringify(actorInput));

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(actorInput),
      signal:  AbortSignal.timeout((SYNC_TIMEOUT + 30) * 1000),
    });
  } catch (err) {
    console.warn('[Apify] Sync fetch threw:', err instanceof Error ? err.message : err);
    return null;
  }

  console.log(`[Apify] Sync status: ${res.status} ${res.statusText}`);
  const raw = await res.text();
  console.log('[Apify] Sync response (first 600 chars):', raw.slice(0, 600));

  if (!res.ok) {
    console.error('[Apify] Sync endpoint error:', raw.slice(0, 400));
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Record<string, unknown>[];
    console.warn('[Apify] Sync returned empty/non-array — will try async');
    return null;
  } catch {
    console.warn('[Apify] Sync returned non-JSON — will try async');
    return null;
  }
}

// ─── Async run → poll → fetch ─────────────────────────────────────────────────
async function runAsync(
  apiKey:     string,
  actorId:    string,
  actorInput: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  console.log(`[Apify] Starting async run | actor: ${actorId}`);

  const runRes = await fetch(
    `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${apiKey}&memory=512`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(actorInput),
    }
  );

  const runBody = await runRes.text();
  console.log(`[Apify] Async run start status: ${runRes.status}`);
  console.log('[Apify] Run start body:', runBody.slice(0, 600));

  if (!runRes.ok) {
    throw new Error(`Failed to start Apify run (${runRes.status}): ${runBody.slice(0, 200)}`);
  }

  const runData = JSON.parse(runBody) as { data: { id: string; defaultDatasetId: string } };
  const { id: runId, defaultDatasetId } = runData.data;
  console.log(`[Apify] Run ID: ${runId} | Dataset: ${defaultDatasetId}`);

  // Poll
  const deadline = Date.now() + POLL_TIMEOUT;
  let status = 'RUNNING';

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    const s = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apiKey}`);
    const sBody = await s.json() as { data: { status: string } };
    status = sBody.data?.status ?? 'UNKNOWN';
    console.log(`[Apify] Poll status: ${status}`);

    if (status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(
        `Apify run ${status}. ` +
        `Check your Apify Console (console.apify.com) for run ${runId} logs.`
      );
    }
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Apify polling timed out after ${POLL_TIMEOUT / 1000}s`);
  }

  // Fetch dataset
  const dataUrl = `${APIFY_BASE}/datasets/${defaultDatasetId}/items?token=${apiKey}&limit=${MAX_REVIEWS}`;
  const dataRes = await fetch(dataUrl);
  const dataBody = await dataRes.text();
  console.log(`[Apify] Dataset fetch status: ${dataRes.status}`);
  console.log('[Apify] Dataset (first 500 chars):', dataBody.slice(0, 500));

  if (!dataRes.ok) throw new Error(`Dataset fetch failed (${dataRes.status})`);
  return JSON.parse(dataBody) as Record<string, unknown>[];
}

// ─── Try one actor definition with sync → async fallback ─────────────────────
async function tryActor(
  apiKey:   string,
  actor:    ActorDef,
  url:      string
): Promise<Record<string, unknown>[] | null> {
  const input = actor.buildInput(url);

  // Strategy 1: sync
  let items: Record<string, unknown>[] | null = null;
  try {
    items = await runSync(apiKey, actor.id, input);
  } catch (err) {
    console.warn('[Apify] Sync threw:', err instanceof Error ? err.message : err);
  }

  if (items && items.length > 0) return items;

  // Strategy 2: async
  try {
    items = await runAsync(apiKey, actor.id, input);
  } catch (err) {
    console.error('[Apify] Async failed:', err instanceof Error ? err.message : err);
    return null;
  }

  return items && items.length > 0 ? items : null;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function scrapeAmazonReviews(rawUrl: string): Promise<ApifyScrapeResult> {
  const apiKey = process.env.APIFY_API_KEY;
  console.log('[Apify] Key prefix:', apiKey ? apiKey.slice(0, 12) + '...' : 'UNDEFINED');
  console.log('[Apify] Raw URL:', rawUrl);

  if (!apiKey) throw new Error('APIFY_API_KEY is not set — add it to .env.local');

  // Resolve amzn.in / amzn.to short URLs to full Amazon URLs first
  let resolvedUrl = rawUrl;
  if (/amzn\.(in|to|com|eu|asia)/i.test(rawUrl)) {
    console.log('[Apify] Short URL detected, resolving...');
    resolvedUrl = await resolveShortUrl(rawUrl);
    console.log('[Apify] Resolved to:', resolvedUrl);
  }

  // Build list of URLs to try: resolved + /product-reviews/ form
  const urlsToTry = Array.from(new Set([resolvedUrl, toReviewsUrl(resolvedUrl)]));
  console.log('[Apify] URLs to try:', urlsToTry);

  let items: Record<string, unknown>[] | null = null;

  // Try each actor × each URL until we get results
  outer:
  for (const actor of ACTORS) {
    for (const url of urlsToTry) {
      console.log(`[Apify] Trying actor="${actor.id}" url="${url}"`);
      items = await tryActor(apiKey, actor, url);
      if (items && items.length > 0) break outer;
    }
  }

  if (!items || items.length === 0) {
    throw new Error(
      "Couldn't fetch reviews for this product — try pasting reviews manually instead."
    );
  }

  const { reviews, productName } = parseItems(items);

  if (reviews.length === 0) {
    throw new Error(
      "Scraped the page but found no review text — try pasting reviews manually instead."
    );
  }

  return { reviews, productName, reviewCount: reviews.length, platform: 'amazon' };
}

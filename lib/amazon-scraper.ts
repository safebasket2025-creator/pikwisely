/**
 * lib/amazon-scraper.ts
 *
 * Direct Amazon review scraper — runs on the server (Next.js API route).
 * Handles both full Amazon URLs and short amzn.in links.
 * Uses rotating User-Agents to reduce bot detection.
 */

import * as cheerio from 'cheerio';

// Rotating browser headers to reduce bot-detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

function getHeaders() {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  };
}

export interface DirectScrapeResult {
  reviews:     string[];
  productName: string;
  reviewCount: number;
}

/**
 * Resolve a short URL (amzn.in, amzn.to, etc.) to its final destination.
 * amzn.in redirects via HTTP 301/302, so we follow the Location header chain.
 */
async function resolveShortUrl(url: string): Promise<string> {
  // Try up to 6 hops to follow the redirect chain manually
  let current = url;
  for (let i = 0; i < 6; i++) {
    let res: Response;
    try {
      res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',        // Don't auto-follow — inspect Location ourselves
        headers: getHeaders(),
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      // Network error — return what we have so far
      break;
    }

    // 3xx redirect — follow the Location header
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) break;
      // Resolve relative Location headers
      current = location.startsWith('http') ? location : new URL(location, current).href;
      console.log(`[DirectScraper] Redirect hop ${i + 1}: ${current}`);
      continue;
    }

    // Non-redirect — we've arrived at the final URL
    break;
  }
  return current;
}

/** Extract the 10-character ASIN from any Amazon product URL */
function extractAsin(url: string): string | null {
  // Match standard patterns: /dp/, /gp/product/, /product-reviews/
  const m = url.match(/\/(?:dp|gp\/product|product-reviews)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

/** Extract domain from URL (e.g. www.amazon.in) */
function extractDomain(url: string): string {
  const m = url.match(/https?:\/\/([^/]+)/i);
  if (m) {
    const host = m[1].toLowerCase();
    if (host.includes('amazon')) return host;
  }
  return 'www.amazon.in';
}

/** Convert any Amazon URL to the reviews page */
function toReviewsUrl(asin: string, domain = 'www.amazon.in'): string {
  return `https://${domain}/product-reviews/${asin}/?reviewerType=all_reviews&sortBy=recent&pageSize=50`;
}

/** Parse HTML with cheerio and pull review texts + product name */
function parseHtml(html: string): DirectScrapeResult | null {
  // Detect bot-blocking pages
  if (
    html.includes('Type the characters you see') ||
    html.includes('Enter the characters you see') ||
    html.toLowerCase().includes('captcha') ||
    html.includes('automated access')
  ) {
    console.warn('[DirectScraper] Bot-detection page detected');
    return null;
  }

  // Detect login redirect
  if (html.includes('ap/signin') || (html.includes('Sign-In') && !html.includes('data-hook="review"'))) {
    console.warn('[DirectScraper] Login redirect detected');
    return null;
  }

  const $ = cheerio.load(html);
  const reviews: string[] = [];

  // Primary selector — standard Amazon review structure
  $('[data-hook="review"]').each((_, el) => {
    const text = $(el).find('[data-hook="review-body"] span').text().trim();
    if (text.length > 10) reviews.push(text);
  });

  // Fallback selectors
  if (reviews.length === 0) {
    $('div.review-text-content span, span.cr-original-review-content').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) reviews.push(text);
    });
  }

  if (reviews.length === 0) {
    $('[data-hook="review-collapsed"] span').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) reviews.push(text);
    });
  }

  const productName =
    $('[data-hook="product-link"]').first().text().trim() ||
    $('a.a-link-normal[data-hook="product-link"]').first().text().trim() ||
    $('#productTitle').first().text().trim() ||
    $('h1.a-size-large').first().text().trim() ||
    'Unknown Product';

  console.log(`[DirectScraper] Parsed ${reviews.length} reviews — product: "${productName}"`);
  return reviews.length > 0 ? { reviews, productName, reviewCount: reviews.length } : null;
}

/** Fetch a URL with retries */
async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: getHeaders(),
        signal: AbortSignal.timeout(20_000),
        redirect: 'follow',
      });
      return res;
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

/** Main entry: scrape Amazon reviews directly */
export async function scrapeAmazonDirect(rawUrl: string): Promise<DirectScrapeResult> {
  let resolvedUrl = rawUrl;

  // Handle amzn.in / amzn.to short links — follow redirect chain manually
  if (/amzn\.(in|to|com\/.*\/|eu|asia)/i.test(rawUrl) || rawUrl.includes('amzn.in')) {
    console.log('[DirectScraper] Short URL detected, resolving:', rawUrl);
    resolvedUrl = await resolveShortUrl(rawUrl);
    console.log('[DirectScraper] Resolved to:', resolvedUrl);
  }

  let asin = extractAsin(resolvedUrl);

  // If we still can't get ASIN (e.g. redirect didn't work), try resolving the original URL
  if (!asin && resolvedUrl === rawUrl) {
    console.log('[DirectScraper] Could not extract ASIN, trying URL resolution...');
    resolvedUrl = await resolveShortUrl(rawUrl);
    console.log('[DirectScraper] Resolved to:', resolvedUrl);
    asin = extractAsin(resolvedUrl);
  }

  if (!asin) {
    throw new Error(
      'Could not extract product ASIN from URL — make sure it is a valid Amazon product link.'
    );
  }

  const domain = extractDomain(resolvedUrl);
  const reviewsUrl = toReviewsUrl(asin, domain);
  console.log('[DirectScraper] ASIN:', asin, '| Fetching:', reviewsUrl);

  let res: Response;
  try {
    res = await fetchWithRetry(reviewsUrl);
  } catch (err) {
    throw new Error(
      `Network error reaching Amazon: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  console.log('[DirectScraper] HTTP status:', res.status, '| final URL:', res.url);

  if (res.status === 404) throw new Error('Product not found on Amazon (404) — double-check the URL.');
  if (res.status === 503 || res.status === 429) {
    throw new Error('Amazon is temporarily rate-limiting requests — try again in a moment.');
  }
  if (!res.ok) throw new Error(`Amazon returned HTTP ${res.status}`);

  const html = await res.text();
  const result = parseHtml(html);

  if (!result) {
    throw new Error(
      'Amazon returned a CAPTCHA or blocked page — server IP may be rate-limited.'
    );
  }

  return result;
}

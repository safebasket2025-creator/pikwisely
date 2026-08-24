/**
 * lib/scrapingbee.ts
 *
 * ScrapingBee integration for Flipkart review scraping.
 * Completely isolated from the Apify/Amazon code in lib/apify.ts.
 *
 * Flipkart is a React SPA — reviews are fetched via XHR after page load.
 * We use ScrapingBee's js_snippet feature to execute JavaScript inside the
 * rendered browser context, so we read the live DOM after JS execution.
 *
 * API docs: https://www.scrapingbee.com/documentation/
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapingBeeResult {
  reviews:     string[];
  productName: string;
  reviewCount: number;
  platform:    'flipkart';
}

// ─── JavaScript snippet (runs inside ScrapingBee's browser) ──────────────────
//
// This code is base64-encoded and sent to ScrapingBee, which executes it
// inside the fully-rendered page. It returns a JSON string with reviews
// and product name extracted from the live DOM.

const JS_SNIPPET = Buffer.from(`
(function () {
  // ── Review text selectors (Flipkart uses minified, rotating class names)
  // We try multiple known patterns in order.
  const TEXT_SELECTORS = [
    'div.ZmyHeo span',            // 2024–2025 primary
    'div._6K-7Co span',           // alternate
    'div.t-ZTKy span',            // older
    'p._2-N8zT',                  // short reviews
    'div[class*="review"] span',  // broad fallback
    'div.row._3O0U0u span',       // another pattern
  ];

  // ── Product name selectors
  const NAME_SELECTORS = [
    'span.B_NuCI',
    'h1.yhB1nd span',
    'div._35KyD6 span',
    'h1[class*="title"]',
  ];

  function getText(el) {
    return (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  // Extract product name
  let productName = 'Unknown Product';
  for (const sel of NAME_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) { productName = getText(el); break; }
  }

  // Extract reviews
  const reviews = [];
  const seen = new Set();
  for (const sel of TEXT_SELECTORS) {
    const els = document.querySelectorAll(sel);
    els.forEach(el => {
      const text = getText(el);
      if (text.length > 30 && !seen.has(text)) {
        seen.add(text);
        reviews.push(text);
      }
    });
    if (reviews.length >= 5) break;
  }

  // Fallback: grab any paragraph/span with substantial text
  if (reviews.length === 0) {
    const all = document.querySelectorAll('p, span, div');
    all.forEach(el => {
      if (el.children.length > 0) return; // skip containers
      const text = getText(el);
      if (text.length > 80 && text.length < 2000 && !seen.has(text)) {
        seen.add(text);
        reviews.push(text);
      }
      if (reviews.length >= 50) return;
    });
  }

  return JSON.stringify({ productName, reviews: reviews.slice(0, 50) });
})();
`).toString('base64');

// ─── URL normaliser ───────────────────────────────────────────────────────────

/**
 * Converts a Flipkart product detail URL to its reviews page URL.
 * IMPORTANT: Flipkart requires both the product slug AND the product ID in the path.
 *
 * Input:  /product-name/p/itmXXXXXXXXXX
 * Output: /product-name/product-reviews/itmXXXXXXXXXX?sortOrder=MOST_HELPFUL
 */
function toFlipkartReviewsUrl(url: string): string {
  try {
    const u = new URL(url);

    // Already on reviews page — return as-is
    if (u.pathname.includes('/product-reviews/')) return url;

    // Match: /{product-slug}/p/{product-id}
    const match = u.pathname.match(/^(\/[^/]+)\/p\/([^/?#]+)/);
    if (match) {
      return `${u.origin}${match[1]}/product-reviews/${match[2]}?sortOrder=MOST_HELPFUL&certifiedBuyer=false&page=1`;
    }

    // Fallback — return unchanged (ScrapingBee will scrape whatever is there)
    return url;
  } catch {
    return url;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Scrapes Flipkart product reviews using ScrapingBee.
 *
 * Uses render_js + js_snippet to execute JavaScript inside the browser after
 * the page has fully rendered, extracting reviews from the live DOM.
 *
 * @throws Error with user-facing message on failure.
 */
export async function scrapeFlipkartReviews(url: string): Promise<ScrapingBeeResult> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Couldn't fetch reviews for this product — try pasting reviews manually instead.");
  }

  const targetUrl = toFlipkartReviewsUrl(url);
  console.log(`[ScrapingBee] Key prefix: ${apiKey.slice(0, 8)}...`);
  console.log(`[ScrapingBee] Input URL : ${url}`);
  console.log(`[ScrapingBee] Target URL: ${targetUrl}`);

  // ── Build request params ────────────────────────────────────────────────────
  const params = new URLSearchParams({
    api_key:        apiKey.trim(),
    url:            targetUrl,
    render_js:      'true',
    // Wait 5 seconds for XHR review data to load
    wait:           '5000',
    // Use premium proxies — Flipkart blocks standard shared proxies
    premium_proxy:  'true',
    // Execute our extraction snippet inside the browser context
    js_snippet:     JS_SNIPPET,
  });

  const apiUrl = `https://app.scrapingbee.com/api/v1/?${params.toString()}`;

  let rawResult: string;
  let responseStatus: number;

  try {
    console.log('[ScrapingBee] Sending request...');
    const res = await fetch(apiUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(120_000), // 2-minute timeout
    });

    responseStatus = res.status;
    rawResult = await res.text();

    console.log(`[ScrapingBee] Status: ${responseStatus} | Response length: ${rawResult.length}`);

    if (!res.ok) {
      console.error(`[ScrapingBee] Error response (${responseStatus}):`, rawResult.slice(0, 600));
      if (responseStatus === 401) throw new Error('ScrapingBee API key invalid or expired.');
      if (responseStatus === 429) throw new Error('ScrapingBee credit limit reached.');
      throw new Error(`ScrapingBee returned HTTP ${responseStatus}`);
    }
  } catch (fetchErr: unknown) {
    const msg = fetchErr instanceof Error ? fetchErr.message : 'Network error';
    console.error('[ScrapingBee] Fetch error:', msg);
    throw new Error("Couldn't fetch reviews for this product — try pasting reviews manually instead.");
  }

  // ── Parse the js_snippet JSON result ────────────────────────────────────────
  // When js_snippet is used, ScrapingBee returns the snippet's return value as the response body.
  let reviews: string[] = [];
  let productName = 'Unknown Product';

  try {
    // The response IS the JSON string returned by our JS snippet
    const parsed = JSON.parse(rawResult) as { productName?: string; reviews?: string[] };
    reviews     = parsed.reviews     ?? [];
    productName = parsed.productName ?? 'Unknown Product';
    console.log(`[ScrapingBee] js_snippet returned: productName="${productName}", reviews=${reviews.length}`);
  } catch {
    // Snippet didn't return JSON — fall back to HTML parsing
    console.warn('[ScrapingBee] js_snippet result not JSON — falling back to HTML parsing');
    const parsed = parseFlipkartHtml(rawResult);
    reviews     = parsed.reviews;
    productName = parsed.productName;
  }

  if (reviews.length === 0) {
    console.error('[ScrapingBee] 0 reviews extracted. Raw response snippet:', rawResult.slice(0, 500));
    throw new Error("Couldn't fetch reviews for this product — try pasting reviews manually instead.");
  }

  console.log(`[ScrapingBee] ✅ ${reviews.length} reviews extracted for "${productName}"`);
  return {
    reviews,
    productName,
    reviewCount: reviews.length,
    platform:    'flipkart',
  };
}

// ─── HTML fallback parser ─────────────────────────────────────────────────────
// Used if js_snippet is unavailable or returns non-JSON.

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function parseFlipkartHtml(html: string): { reviews: string[]; productName: string } {
  // Product name
  let productName = 'Unknown Product';
  const namePatterns = [
    /class="[^"]*B_NuCI[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
    /<title>([^<|]+)/i,
  ];
  for (const p of namePatterns) {
    const m = html.match(p);
    if (m) { productName = stripHtml(m[1]).trim(); break; }
  }

  // Reviews via broad span extraction
  const reviews: string[] = [];
  const seen = new Set<string>();
  const spanRe = /<span[^>]*>([^<]{80,})<\/span>/gi;
  let m;
  while ((m = spanRe.exec(html)) !== null && reviews.length < 50) {
    const text = stripHtml(m[1]).trim();
    if (
      text.length > 50 &&
      !text.includes('function') &&
      !text.includes('window.') &&
      !text.startsWith('var ') &&
      !seen.has(text)
    ) {
      seen.add(text);
      reviews.push(text);
    }
  }

  console.log(`[ScrapingBee] HTML fallback: productName="${productName}", reviews=${reviews.length}`);
  return { reviews: reviews.slice(0, 50), productName };
}

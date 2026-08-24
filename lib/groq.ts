/**
 * lib/groq.ts — Groq API wrapper.
 * Confirmed WORKING models on this account (tested 2026-08-21):
 *   groq/compound, groq/compound-mini, qwen/qwen3.6-27b
 * BROKEN (empty content): openai/gpt-oss-120b, openai/gpt-oss-20b
 */


const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = [
  'groq/compound-mini',   // primary — faster, same quality, handles larger context
  'groq/compound',        // secondary
  'qwen/qwen3.6-27b',     // last resort — think blocks stripped before JSON parse
];
const MAX_TOKENS = 1024;
const MAX_INPUT  = 6000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface GroqAnalysisResult {
  suggestion:        'Strong Opportunity' | 'Proceed with Caution' | 'High Risk';
  confidence:        'High' | 'Medium' | 'Low';
  confidenceReason:  string;
  sentimentScore:    number;
  neutralScore:      number;
  negativeScore:     number;
  topComplaints:     { issue: string; percentage: number; severity: 'Minor' | 'Severe'; example: string }[];
  topStrengths:      { point: string; percentage: number; example: string }[];
  inconsistencies:   string[];
  keyTakeaway:       string;
  suggestedAction:   string;
  reviewCount:       number;
  dataSource:        string;
  productName?:      string;
}

const VALID_SUGGESTIONS = ['Strong Opportunity', 'Proceed with Caution', 'High Risk'] as const;
const VALID_CONFIDENCES = ['High', 'Medium', 'Low'] as const;

// ─── System prompt (sent as role=system) ──────────────────────────────────────

const SYSTEM_PROMPT = `You are analyzing raw customer reviews pasted by an e-commerce seller deciding whether to source this product. The reviews may be messy, unstructured, and contain typos.

Your job is to extract insights a busy person skimming reviews would MISS — not restate what's obvious.

Rules:
- Never use vague filler like 'has pros and cons' or 'mixed reviews' — always be specific with percentages and patterns
- Base all percentages on the actual reviews provided — do not invent numbers, counts, or details not present in the text
- Distinguish between FREQUENT minor complaints and RARE but SEVERE complaints (e.g., safety issues, product not working at all) — flag severe issues even if mentioned only once
- If reviews contradict each other on the same topic (e.g., some say fast delivery, others say slow), explicitly flag this as an 'Inconsistency' — this is valuable signal
- Include one short paraphrased example (not a direct quote) per complaint/strength to ground it in real feedback

CONFIDENCE RULES (CRITICAL):
Do NOT default to High confidence. Confidence must be calculated strictly based on review count and sentiment consistency, following the exact thresholds given — regardless of how clear-cut the sentiment pattern appears with a small sample.
- LOW confidence: fewer than 15 reviews provided. With fewer than 15 reviews, confidence must be Low even if 90%+ of those reviews agree.
- MEDIUM confidence: 15-30 reviews provided. OR 30+ reviews if the sentiment is very mixed/inconsistent (close to an even split between positive/negative, like 50/50 or 45/55).
- HIGH confidence: 30+ reviews provided AND sentiment is fairly consistent.

Respond ONLY with valid JSON, no markdown formatting, in this exact shape:
{
  "suggestion": "Strong Opportunity" | "Proceed with Caution" | "High Risk",
  "confidence": "High" | "Medium" | "Low",
  "confidenceReason": "exact review count and reason, e.g. 'Low confidence — based on only 10 reviews, a larger sample would give more reliable results' or 'High confidence — based on 45 consistent reviews'",
  "sentimentScore": 0-100,
  "neutralScore": 0-100,
  "negativeScore": 0-100,
  "topComplaints": [{ "issue": "string", "percentage": number, "severity": "Minor" | "Severe", "example": "string" }],
  "topStrengths": [{ "point": "string", "percentage": number, "example": "string" }],
  "inconsistencies": ["string"],
  "keyTakeaway": "one sentence — the single most important insight",
  "suggestedAction": "string",
  "reviewCount": number
}`;

// ─── User prompt builder ───────────────────────────────────────────────────────

function buildUserPrompt(rawText: string, strict = false): string {
  const strictLine = strict
    ? '\n\nWARNING: Your previous response could not be parsed. Output ONLY the raw JSON object. Nothing else.'
    : '';

  return `Analyze the following product review text. It may be messy, unformatted, or contain multiple reviews.

REVIEW TEXT:
${rawText}

Return a JSON object matching this exact schema (no markdown, no code fences — raw JSON only):
{
  "suggestion": "Strong Opportunity",
  "confidence": "High",
  "confidenceReason": "based on N reviews",
  "sentimentScore": 75,
  "neutralScore": 15,
  "negativeScore": 10,
  "topComplaints": [
    { "issue": "Short battery life", "percentage": 25, "severity": "Minor", "example": "Several buyers mentioned the battery dies by evening" },
    { "issue": "Stopped working after 2 weeks", "percentage": 8, "severity": "Severe", "example": "One reviewer reported the device completely failed after 2 weeks of use" }
  ],
  "topStrengths": [
    { "point": "Great sound quality", "percentage": 45, "example": "Multiple buyers praised the clear and loud audio" }
  ],
  "inconsistencies": [
    "Delivery speed: some reviewers mention same-day arrival, others report 2-week waits"
  ],
  "keyTakeaway": "The single most important insight for a seller evaluating this product.",
  "suggestedAction": "Actionable advice for a seller or buyer.",
  "reviewCount": 10
}

Hard rules:
- suggestion: exactly one of "Strong Opportunity", "Proceed with Caution", "High Risk"
- confidence: exactly one of "High", "Medium", "Low" — use "Low" if fewer than 5 reviews
- sentimentScore + neutralScore + negativeScore should sum to ~100
- topComplaints: 2–4 entries, severity = "Severe" if the issue is a safety concern or total product failure
- topStrengths: 2–4 entries
- inconsistencies: empty array [] if no contradictions found
- reviewCount: actual count of distinct reviews identified${strictLine}`;
}

// ─── JSON extraction — strips think blocks, fences, and preamble ──────────────

function extractJson(raw: string): GroqAnalysisResult {
  let s = raw;

  // 1. Strip <think>…</think> blocks (Qwen chain-of-thought).
  //    Use GREEDY match — lazy fails when the think block is very long and
  //    the model hasn't finished it (the closing tag may be missing).
  //    Also handle unclosed think blocks by stripping everything after <think>.
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '');
  s = s.replace(/<think>[\s\S]*/gi, ''); // remove unclosed think block

  // 2. Strip markdown code fences
  s = s.replace(/```(?:json)?/gi, '');

  // 3. Find the first '{' then walk forward tracking brace depth to find its
  //    matching '}'. This handles cases where Qwen appends text after the JSON.
  const open = s.indexOf('{');
  if (open === -1) {
    console.error('[Groq] No { found in response. Raw (first 300):', raw.slice(0, 300));
    throw new Error('No JSON object found in model response.');
  }

  let depth = 0;
  let close = -1;
  let inString = false;
  let escape = false;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { close = i; break; }
    }
  }
  if (close === -1) {
    console.error('[Groq] Unmatched braces. Raw (first 300):', raw.slice(0, 300));
    throw new Error('Unmatched braces in model response.');
  }

  s = s.slice(open, close + 1).trim();

  // 4. Remove trailing commas before ] or } (common Qwen quirk)
  s = s.replace(/,(\s*[}\]])/g, '$1');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(s) as Record<string, unknown>;
  } catch (e) {
    console.error('[Groq] JSON.parse failed. Extracted string:', s.slice(0, 300));
    throw e;
  }

  // 4. Validate & coerce suggestion
  let suggestion = parsed.suggestion as string;
  if (!VALID_SUGGESTIONS.includes(suggestion as typeof VALID_SUGGESTIONS[number])) {
    const found = VALID_SUGGESTIONS.find(v =>
      String(suggestion ?? '').toLowerCase().includes(v.toLowerCase().split(' ')[0])
    );
    if (found) suggestion = found;
    else throw new Error(`Invalid suggestion value: "${suggestion}"`);
  }

  // 5. Validate & coerce confidence
  let confidence = parsed.confidence as string;
  if (!VALID_CONFIDENCES.includes(confidence as typeof VALID_CONFIDENCES[number])) {
    const found = VALID_CONFIDENCES.find(v =>
      String(confidence ?? '').toLowerCase().startsWith(v.toLowerCase())
    );
    confidence = found ?? 'Medium';
  }

  // 6. Coerce complaints — ensure severity & example fields exist
  const rawComplaints = (Array.isArray(parsed.topComplaints) ? parsed.topComplaints : []) as Record<string, unknown>[];
  const topComplaints = rawComplaints.slice(0, 5).map(c => ({
    issue:      String(c.issue      ?? ''),
    percentage: Math.round(Number(c.percentage ?? 0)),
    severity:   (['Minor', 'Severe'].includes(String(c.severity)) ? c.severity : 'Minor') as 'Minor' | 'Severe',
    example:    String(c.example    ?? ''),
  }));

  // 7. Coerce strengths — ensure example field exists
  const rawStrengths = (Array.isArray(parsed.topStrengths) ? parsed.topStrengths : []) as Record<string, unknown>[];
  const topStrengths = rawStrengths.slice(0, 5).map(st => ({
    point:      String(st.point      ?? ''),
    percentage: Math.round(Number(st.percentage ?? 0)),
    example:    String(st.example    ?? ''),
  }));

  // 8. Coerce inconsistencies
  const inconsistencies = (Array.isArray(parsed.inconsistencies) ? parsed.inconsistencies : [])
    .map(i => String(i))
    .filter(Boolean);

  return {
    suggestion:       suggestion       as GroqAnalysisResult['suggestion'],
    confidence:       confidence       as GroqAnalysisResult['confidence'],
    confidenceReason: String(parsed.confidenceReason ?? ''),
    sentimentScore:   Math.round(Number(parsed.sentimentScore  ?? 50)),
    neutralScore:     Math.round(Number(parsed.neutralScore    ?? 20)),
    negativeScore:    Math.round(Number(parsed.negativeScore   ?? 30)),
    topComplaints,
    topStrengths,
    inconsistencies,
    keyTakeaway:      String(parsed.keyTakeaway     ?? ''),
    suggestedAction:  String(parsed.suggestedAction ?? ''),
    reviewCount:      Math.round(Number(parsed.reviewCount     ?? 1)),
    dataSource:       'manual',
    productName:      parsed.productName ? String(parsed.productName) : undefined,
  };
}

// ─── Core API call ─────────────────────────────────────────────────────────────

async function callGroq(userPrompt: string, modelIndex = 0, isRetry = false): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');

  if (modelIndex >= MODELS.length) throw new Error('All models exhausted.');
  const model = MODELS[modelIndex];
  console.log(`[Groq] Calling model: ${model}`);

  let res;
  try {
    res = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens:  MAX_TOKENS,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (fetchErr: any) {
    if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
      throw new Error('Analysis is taking longer than expected, please try again');
    }
    throw fetchErr;
  }

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    
    if (res.status === 429) {
      if (!isRetry) {
        console.warn(`[Groq] Rate limit hit (429). Waiting 2.5s and retrying...`);
        await sleep(2500);
        return callGroq(userPrompt, modelIndex, true);
      } else {
        throw new Error("We're experiencing high demand right now, please try again in a moment");
      }
    }

    if ((res.status === 404 || res.status === 503 || res.status === 400 || res.status === 413) && modelIndex < MODELS.length - 1) {
      const retryAfter = Number(res.headers.get('retry-after') ?? '0');
      const waitMs = Math.min((retryAfter || 2) * 1000, 8000);
      console.warn(`[Groq] Model ${model} error (${res.status}), waiting ${waitMs}ms then trying next...`);
      await sleep(waitMs);
      return callGroq(userPrompt, modelIndex + 1);
    }
    throw new Error(`Groq API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';
  console.log(`[Groq] Response length: ${content.length} chars`);

  // Empty response = model failed silently — try next
  if (!content.trim() && modelIndex < MODELS.length - 1) {
    console.warn(`[Groq] Model ${model} returned empty response, trying next...`);
    await sleep(1000);
    return callGroq(userPrompt, modelIndex + 1);
  }

  return content;
}

// ─── Public export ─────────────────────────────────────────────────────────────

/**
 * Analyse raw pasted review text. Retries once with a stricter prompt on failure.
 */
export async function analyzeReviews(rawText: string): Promise<GroqAnalysisResult> {
  const text = rawText.slice(0, MAX_INPUT);
  console.log(`[Groq] Analyzing ${text.length} chars of pasted review text`);

  let raw: string;

  // First attempt — start from model index 0
  try {
    raw = await callGroq(buildUserPrompt(text));
    const result = extractJson(raw);
    console.log('[Groq] ✅ First attempt succeeded');
    return result;
  } catch (firstErr) {
    console.warn('[Groq] First attempt failed:', (firstErr as Error).message);
    const msg = (firstErr as Error).message;
    if (msg.includes('high demand') || msg.includes('longer than expected')) {
      throw firstErr;
    }
    // Brief pause before retry so TPM window partially resets
    await sleep(3000);
  }

  // Retry — use strict prompt, start from model index 0 again (fresh TPM window)
  try {
    raw = await callGroq(buildUserPrompt(text, true));
    const result = extractJson(raw);
    console.log('[Groq] ✅ Retry succeeded');
    return result;
  } catch (secondErr) {
    console.error('[Groq] Both attempts failed:', (secondErr as Error).message);
    throw new Error('AI analysis failed. Please try again in a moment.');
  }
}

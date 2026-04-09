import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, resolveIp } from './_rateLimit';

// M5 fix: internal timeout 55s (under Vercel's 60s maxDuration).
// AbortController abort is now checked synchronously before accessing response.
const GEMINI_TIMEOUT_MS = 55_000;

/** Maximum allowed characters for the prompt contents field. */
const MAX_CONTENTS_LENGTH = 100_000;

/** Models the proxy is allowed to forward to. */
const ALLOWED_MODEL_PREFIXES = ['gemini-'];

/**
 * Exhaustive allowlist of SDK GenerateContentConfig keys the client is
 * permitted to set. Any key not in this list is silently dropped before
 * the config object is forwarded to the Gemini SDK.
 *
 * responseSchema is intentionally excluded: it is an open Record<string,unknown>
 * with no runtime validation boundary — passing it through would allow
 * clients to inject arbitrary SDK-level overrides.
 */
const ALLOWED_CONFIG_KEYS = new Set([
  'temperature',
  'topP',
  'topK',
  'maxOutputTokens',
  'stopSequences',
  'candidateCount',
  'presencePenalty',
  'frequencyPenalty',
  'seed',
  'responseMimeType',
] as const);

type SanitizedConfig = {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  candidateCount?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  seed?: number;
  responseMimeType?: string;
};

/**
 * Strips any key not in ALLOWED_CONFIG_KEYS and validates primitive types.
 * Non-conforming values are dropped silently — we never reflect raw
 * client-supplied error details back in the response.
 */
function sanitizeConfig(raw: Record<string, unknown>): SanitizedConfig {
  const out: SanitizedConfig = {};
  for (const key of ALLOWED_CONFIG_KEYS) {
    if (!(key in raw)) continue;
    const val = raw[key];
    switch (key) {
      case 'temperature':
      case 'topP':
      case 'topK':
      case 'maxOutputTokens':
      case 'candidateCount':
      case 'presencePenalty':
      case 'frequencyPenalty':
      case 'seed':
        if (typeof val === 'number' && isFinite(val)) {
          (out as Record<string, unknown>)[key] = val;
        }
        break;
      case 'stopSequences':
        if (
          Array.isArray(val) &&
          val.every((s): s is string => typeof s === 'string')
        ) {
          out.stopSequences = val;
        }
        break;
      case 'responseMimeType':
        if (typeof val === 'string') {
          out.responseMimeType = val;
        }
        break;
    }
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // --- Rate limiting ---
  const ip = resolveIp(
    req.headers as Record<string, string | string[] | undefined>,
    req.socket?.remoteAddress
  );
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    res.status(429).json({ error: `Rate limit exceeded. Retry after ${rl.retryAfterSec}s.` });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object' });
      return;
    }

    const { model, contents, config } = req.body as {
      model: string;
      contents: string;
      config?: Record<string, unknown>;
    };

    if (!model || typeof model !== 'string' || !contents || typeof contents !== 'string') {
      res.status(400).json({ error: 'Missing required fields: model (string), contents (string)' });
      return;
    }

    if (!ALLOWED_MODEL_PREFIXES.some(prefix => model.startsWith(prefix))) {
      res.status(400).json({ error: `Model "${model}" is not allowed` });
      return;
    }

    if (contents.length > MAX_CONTENTS_LENGTH) {
      res.status(400).json({ error: `Contents exceeds maximum length of ${MAX_CONTENTS_LENGTH} characters` });
      return;
    }

    // Sanitize the config object: only allowed keys with validated types pass
    // through. abortSignal is injected server-side and must never come from
    // the client.
    const sanitizedConfig = config != null && typeof config === 'object'
      ? sanitizeConfig(config)
      : {};

    const ai = new GoogleGenAI({ apiKey });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: { ...sanitizedConfig, abortSignal: controller.signal },
      });
    } finally {
      clearTimeout(timer);
    }

    // Check abort status synchronously after await resolves
    if (controller.signal.aborted) {
      res.status(504).json({ error: 'AI generation timed out. Please try again.' });
      return;
    }

    res.status(200).json({ text: response.text ?? '' });
  } catch (error: unknown) {
    const isAbort =
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error && error.name === 'AbortError');
    if (isAbort) {
      res.status(504).json({ error: 'AI generation timed out. Please try again.' });
      return;
    }

    // Extract human-readable message from @google/genai SDK errors.
    let message = 'Unknown server error';
    if (error instanceof Error) {
      let parsed = false;
      try {
        const body = JSON.parse(error.message) as { error?: { message?: string } };
        if (typeof body?.error?.message === 'string') {
          message = body.error.message;
          parsed = true;
        }
      } catch { /* not JSON — fall through */ }
      if (!parsed) message = error.message;
    }

    const httpCode = (() => {
      if (!(error instanceof Error)) return 500;
      const e = error as unknown as Record<string, unknown>;
      if (typeof e.status === 'number' && e.status >= 400 && e.status < 600) return e.status;
      if (typeof e.code === 'number' && e.code >= 400 && e.code < 600) return e.code;
      return 500;
    })();

    res.status(httpCode).json({ error: message });
  }
}

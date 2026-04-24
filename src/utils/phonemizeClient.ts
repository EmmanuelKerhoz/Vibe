/**
 * Client for G2P phonemization microservice
 */
import { z } from 'zod';
import { isAbortError } from './withAbort';

export interface PhonemeRequest {
  text: string;
  lang: string;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────
// Types are DERIVED from Zod to stay compatible with exactOptionalPropertyTypes.
// Do NOT define separate interfaces for Syllable / PhonemeResponse — they would
// diverge from the inferred Zod types and trigger TS2375.

const SyllableSchema = z.object({
  onset: z.string(),
  nucleus: z.string(),
  coda: z.string(),
  tone: z.string().optional(),
  stress: z.boolean().optional(),
});

const PhonemeResponseSchema = z.object({
  algo_id: z.string(),
  lang: z.string(),
  input: z.string(),
  ipa: z.string(),
  syllables: z.array(SyllableSchema),
  rhyme_nucleus: z.string(),
  method: z.string(),
  low_resource: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

export type Syllable = z.infer<typeof SyllableSchema>;
export type PhonemeResponse = z.infer<typeof PhonemeResponseSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

/** Timeout (ms) for the health-check probe — avoids indefinite hang. */
const HEALTH_CHECK_TIMEOUT_MS = 3_000;

/**
 * Per-request timeout (ms) for the phonemize POST endpoint.
 *
 * Without this, a single slow or hung response would stall every consumer
 * that fans out via {@link runIPAPipelineBatch}'s `Promise.all` — the whole
 * batch would wait forever on one stuck line. The timeout is composed with
 * the caller's `AbortSignal` so explicit cancellation still wins.
 */
const PHONEMIZE_REQUEST_TIMEOUT_MS = 15_000;

const isPhonemizeEnabled = () => import.meta.env.VITE_PHONEMIZE_ENABLED !== 'false';

/**
 * Compose the caller's `AbortSignal` with a per-request timeout signal so
 * the fetch is cancelled whichever fires first.
 */
const makePhonemizeSignal = (
  outerSignal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!outerSignal) return timeoutSignal;
  return AbortSignal.any([outerSignal, timeoutSignal]);
};

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Call the phonemization microservice.
 * Returns null if service is unavailable or request fails.
 */
export const phonemizeText = async (
  text: string,
  lang: string,
  signal?: AbortSignal,
): Promise<PhonemeResponse | null> => {
  try {
    if (!isPhonemizeEnabled()) return null;

    const apiUrl = import.meta.env.VITE_PHONEMIZE_API_URL;
    if (!apiUrl) {
      console.warn('PHONEMIZE_API_URL not configured - G2P service unavailable');
      return null;
    }

    const response = await fetch(`${apiUrl}/api/phonemize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang } satisfies PhonemeRequest),
      signal: makePhonemizeSignal(signal, PHONEMIZE_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`Phonemization service returned ${response.status}`);
      return null;
    }

    const raw: unknown = await response.json();
    const parsed = PhonemeResponseSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn('[phonemizeText] Unexpected response shape:', parsed.error);
      return null;
    }
    return parsed.data;
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) throw error;
    console.warn('Failed to call phonemization service:', error);
    return null;
  }
};

/**
 * Check if phonemization service is available.
 * Uses a 3-second AbortSignal timeout to prevent indefinite hangs.
 */
export const isPhonemizeServiceAvailable = async (): Promise<boolean> => {
  try {
    if (!isPhonemizeEnabled()) return false;

    const apiUrl = import.meta.env.VITE_PHONEMIZE_API_URL;
    if (!apiUrl) return false;

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
};

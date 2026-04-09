/**
 * Client for G2P phonemization microservice
 * This is a stub implementation - service needs to be deployed first
 */
import { z } from 'zod';

export interface PhonemeRequest {
  text: string;
  lang: string;
}

export interface Syllable {
  onset: string;
  nucleus: string;
  coda: string;
  tone?: string;
  stress?: boolean;
}

export interface PhonemeResponse {
  algo_id: string;
  lang: string;
  input: string;
  ipa: string;
  syllables: Syllable[];
  rhyme_nucleus: string;
  method: string;
  low_resource: boolean;
  metadata?: Record<string, unknown>;
}

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

/** Timeout (ms) for the health-check probe — avoids indefinite hang. */
const HEALTH_CHECK_TIMEOUT_MS = 3_000;

const isPhonemizeEnabled = () => import.meta.env.VITE_PHONEMIZE_ENABLED !== 'false';
const isAbortError = (error: unknown) =>
  (error instanceof DOMException && error.name === 'AbortError')
  || (error instanceof Error && error.name === 'AbortError');

/**
 * Call the phonemization microservice
 * Returns null if service is unavailable or request fails
 */
export const phonemizeText = async (
  text: string,
  lang: string,
  signal?: AbortSignal,
): Promise<PhonemeResponse | null> => {
  try {
    if (!isPhonemizeEnabled()) {
      return null;
    }

    const apiUrl = import.meta.env.VITE_PHONEMIZE_API_URL;
    if (!apiUrl) {
      console.warn('PHONEMIZE_API_URL not configured - G2P service unavailable');
      return null;
    }

    const response = await fetch(`${apiUrl}/api/phonemize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang } satisfies PhonemeRequest),
      signal: signal ?? null,
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
    if (signal?.aborted || isAbortError(error)) {
      throw error;
    }
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

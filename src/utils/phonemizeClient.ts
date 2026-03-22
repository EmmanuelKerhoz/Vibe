/**
 * Client for G2P phonemization microservice
 * This is a stub implementation - service needs to be deployed first
 */

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

const isPhonemizeEnabled = () => import.meta.env.VITE_PHONEMIZE_ENABLED !== 'false';

/**
 * Call the phonemization microservice
 * Returns null if service is unavailable or request fails
 */
export const phonemizeText = async (text: string, lang: string): Promise<PhonemeResponse | null> => {
  try {
    if (!isPhonemizeEnabled()) {
      return null;
    }

    // Check if PHONEMIZE_API_URL is configured
    const apiUrl = import.meta.env.VITE_PHONEMIZE_API_URL;
    if (!apiUrl) {
      console.warn('PHONEMIZE_API_URL not configured - G2P service unavailable');
      return null;
    }

    const response = await fetch(`${apiUrl}/api/phonemize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, lang } satisfies PhonemeRequest),
    });

    if (!response.ok) {
      console.warn(`Phonemization service returned ${response.status}`);
      return null;
    }

    const result = await response.json() as PhonemeResponse;
    return result;
  } catch (error) {
    console.warn('Failed to call phonemization service:', error);
    return null;
  }
};

/**
 * Check if phonemization service is available
 */
export const isPhonemizeServiceAvailable = async (): Promise<boolean> => {
  try {
    if (!isPhonemizeEnabled()) return false;

    const apiUrl = import.meta.env.VITE_PHONEMIZE_API_URL;
    if (!apiUrl) return false;

    const response = await fetch(`${apiUrl}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};

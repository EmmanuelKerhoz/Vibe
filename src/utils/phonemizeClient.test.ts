import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isPhonemizeServiceAvailable, phonemizeText } from './phonemizeClient';

const env = import.meta.env as Record<string, string | undefined>;
const originalEnabled = env.VITE_PHONEMIZE_ENABLED;
const originalApiUrl = env.VITE_PHONEMIZE_API_URL;

describe('phonemizeClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    env.VITE_PHONEMIZE_ENABLED = 'true';
    env.VITE_PHONEMIZE_API_URL = 'https://phonemize.test';
  });

  afterEach(() => {
    env.VITE_PHONEMIZE_ENABLED = originalEnabled;
    env.VITE_PHONEMIZE_API_URL = originalApiUrl;
  });

  it('short-circuits requests when phonemization is disabled', async () => {
    env.VITE_PHONEMIZE_ENABLED = 'false';
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(phonemizeText('bonjour', 'fr')).resolves.toBeNull();
    await expect(isPhonemizeServiceAvailable()).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

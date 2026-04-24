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

  it('passes a composed AbortSignal (caller + per-request timeout) to fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        algo_id: 'x', lang: 'fr', input: 'bonjour', ipa: 'bɔ̃ʒuʁ',
        syllables: [], rhyme_nucleus: '', method: 'service', low_resource: false,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    const controller = new AbortController();
    await phonemizeText('bonjour', 'fr', controller.signal);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    // The forwarded signal must NOT be the raw caller signal — it is a
    // composite of (caller, timeout). If the caller signal were forwarded
    // verbatim, a hung server would block the whole IPA batch forever.
    expect(init?.signal).not.toBe(controller.signal);
  });

  it('attaches a timeout signal even when no caller signal is provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        algo_id: 'x', lang: 'fr', input: 'bonjour', ipa: 'bɔ̃ʒuʁ',
        syllables: [], rhyme_nucleus: '', method: 'service', low_resource: false,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    await phonemizeText('bonjour', 'fr');

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns null (does not throw) when the per-request timeout aborts the fetch', async () => {
    // Simulate a TimeoutError DOMException, which is what AbortSignal.timeout
    // produces. This must NOT propagate as an abort — it should be treated
    // as a transient service failure so Promise.all callers can recover.
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new DOMException('signal timed out', 'TimeoutError'),
    );

    await expect(phonemizeText('bonjour', 'fr')).resolves.toBeNull();
  });

  it('still re-throws when the caller explicitly aborts', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new DOMException('aborted', 'AbortError'),
    );

    await expect(phonemizeText('bonjour', 'fr', controller.signal)).rejects.toThrow();
  });
});

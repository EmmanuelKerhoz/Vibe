import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  phonemizeText: vi.fn(),
  graphemeToIPA: vi.fn(),
  syllabifyIPA: vi.fn(),
  extractRhymeNucleus: vi.fn(),
}));

vi.mock('./phonemizeClient', () => ({
  phonemizeText: mocks.phonemizeText,
}));

vi.mock('./g2pUtils', () => ({
  graphemeToIPA: mocks.graphemeToIPA,
}));

vi.mock('./ipaSyllabification', () => ({
  syllabifyIPA: mocks.syllabifyIPA,
  extractRhymeNucleus: mocks.extractRhymeNucleus,
}));

import { compareTextsWithIPA, detectRhymeSchemeLocallyIPA, getToneWeightForLangCode, TONE_WEIGHT_DEFAULTS } from './ipaPipeline';

describe('ipaPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to client-side G2P when phonemization service fails', async () => {
    mocks.phonemizeText.mockRejectedValue(new Error('service unavailable'));
    mocks.graphemeToIPA
      .mockReturnValueOnce('ʃa')
      .mockReturnValueOnce('ʁa');
    mocks.syllabifyIPA
      .mockReturnValueOnce([{ onset: 'ʃ', nucleus: 'a', coda: '' }])
      .mockReturnValueOnce([{ onset: 'ʁ', nucleus: 'a', coda: '' }]);
    mocks.extractRhymeNucleus.mockReturnValue('a');

    const result = await compareTextsWithIPA('chat', 'rat', 'fr');

    expect(mocks.phonemizeText).toHaveBeenCalledTimes(2);
    expect(mocks.graphemeToIPA).toHaveBeenCalledTimes(2);
    expect(result.score).toBe(1);
    expect(result.quality).toBe('rich');
    expect(result.method).toBe('exact');
  });

  it('detects IPA rhyme schemes while leaving singleton lines as X', async () => {
    const responses = new Map([
      ['cat', { ipa: 'kæt', low_resource: false, syllables: [{ onset: 'k', nucleus: 'æ', coda: 't' }] }],
      ['bat', { ipa: 'bæt', low_resource: false, syllables: [{ onset: 'b', nucleus: 'æ', coda: 't' }] }],
      ['sun', { ipa: 'sʌn', low_resource: false, syllables: [{ onset: 's', nucleus: 'ʌ', coda: 'n' }] }],
      ['moon', { ipa: 'muːn', low_resource: false, syllables: [{ onset: 'm', nucleus: 'uː', coda: 'n' }] }],
    ]);

    mocks.phonemizeText.mockImplementation(async (text: string) => responses.get(text));
    mocks.extractRhymeNucleus.mockImplementation((syllables: Array<{ nucleus: string; coda: string }>) => {
      const syllable = syllables[0];
      return `${syllable?.nucleus ?? ''}${syllable?.coda ?? ''}`;
    });

    const result = await detectRhymeSchemeLocallyIPA(['cat', 'bat', 'sun', 'moon'], 'en');

    expect(result).toBe('AAXX');
  });
});

// ─── getToneWeightForLangCode + TONE_WEIGHT_DEFAULTS ─────────────────────────

describe('getToneWeightForLangCode', () => {
  it('returns the default weight for a tonal language (Vietnamese/ALGO-VIET)', () => {
    // Vietnamese is in ALGO-VIET with weight 0.70
    const weight = getToneWeightForLangCode('vi');
    expect(weight).toBe(TONE_WEIGHT_DEFAULTS['ALGO-VIET']);
    expect(weight).toBe(0.70);
  });

  it('returns 0.0 for a non-tonal language regardless of override', () => {
    // French is ALGO-ROM, not in TONE_WEIGHT_DEFAULTS → non-tonal → always 0.0
    expect(getToneWeightForLangCode('fr')).toBe(0.0);
    // Override must also be clamped to 0.0 for non-tonal families
    expect(getToneWeightForLangCode('fr', 0.9)).toBe(0.0);
  });

  it('applies caller override for tonal languages and clamps to [0, 1]', () => {
    // Mandarin is ALGO-SIN, default 0.70
    expect(getToneWeightForLangCode('zh', 0.4)).toBe(0.4);
    expect(getToneWeightForLangCode('zh', -0.5)).toBe(0.0);
    expect(getToneWeightForLangCode('zh', 1.5)).toBe(1.0);
  });

  it('cross-family conservative min: only penalises when both are tonal', async () => {
    // Simulate cross-family: 'fr' (non-tonal, tw=0) + 'vi' (tonal, tw=0.70)
    // min(0, 0.70) but conservative rule is: only apply when BOTH > 0
    // so effectiveToneWeight = 0 → no penalty
    mocks.phonemizeText.mockResolvedValue({
      ipa: 'la',
      low_resource: false,
      syllables: [{ onset: 'l', nucleus: 'a', coda: '', tone: undefined }],
    });
    mocks.extractRhymeNucleus.mockReturnValue('a');

    const result = await compareTextsWithIPA('la', 'la', 'fr', { langCode2: 'vi' });
    // Both nuclei are identical ('a'), score should be 1.0 regardless of tone
    expect(result.score).toBe(1.0);
  });

  it('cross-family: both tonal — effectiveToneWeight = min(tw1, tw2)', async () => {
    // 'vi' → 0.70, 'zh' → 0.70 → min = 0.70; but tones match → no penalty
    mocks.phonemizeText.mockResolvedValue({
      ipa: 'ma',
      low_resource: false,
      syllables: [{ onset: 'm', nucleus: 'a', coda: '', tone: '1' }],
    });
    mocks.extractRhymeNucleus.mockReturnValue('a');

    const result = await compareTextsWithIPA('ma', 'ma', 'vi', { langCode2: 'zh' });
    // Same tone on both sides → tones match → base score returned unchanged
    expect(result.score).toBe(1.0);
  });
});

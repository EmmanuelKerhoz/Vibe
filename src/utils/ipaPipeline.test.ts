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

import { compareTextsWithIPA, detectRhymeSchemeLocallyIPA } from './ipaPipeline';

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

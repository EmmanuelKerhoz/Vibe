import { describe, expect, it } from 'vitest';
import { PhonologicalRegistry } from '../index';

describe('script-specific strategies', () => {
  it('registers Japanese strategy with mora-based long-vowel handling', () => {
    const result = PhonologicalRegistry.analyze('きょう', 'ja');

    expect(result?.algoId).toBe('ALGO-JAP');
    expect(result?.ipa).toBe('kyo u');
    expect(result?.syllables).toHaveLength(2);
    expect(result?.rhymeNucleus.nucleus).toBe('u');
  });

  it('registers Korean strategy with Hangul nucleus+coda rhyme extraction', () => {
    const result = PhonologicalRegistry.analyze('강', 'ko');

    expect(result?.algoId).toBe('ALGO-KOR');
    expect(result?.rhymeNucleus.nucleus).toBe('a');
    expect(result?.rhymeNucleus.coda).toBe('ng');
    expect(result?.rhymeNucleus.codaClass).toBe('nasal');
  });

  it('registers Austronesian strategy and ignores Tagalog infixes for rhyme extraction', () => {
    const bare = PhonologicalRegistry.analyze('kanta', 'tl');
    const infixed = PhonologicalRegistry.analyze('kumanta', 'tl');
    const comparison = PhonologicalRegistry.compare('kanta', 'kumanta', 'tl');

    expect(bare?.algoId).toBe('ALGO-AUS');
    expect(infixed?.algoId).toBe('ALGO-AUS');
    expect(bare?.rhymeNucleus.nucleus).toBe('a');
    expect(infixed?.rhymeNucleus.nucleus).toBe('a');
    expect(comparison?.score).toBe(1);
  });

  it('ignores common Indonesian prefixes and keeps the same final open-syllable rhyme', () => {
    const bare = PhonologicalRegistry.analyze('lari', 'id');
    const prefixed = PhonologicalRegistry.analyze('berlari', 'id');

    expect(bare?.rhymeNucleus.nucleus).toBe('i');
    expect(prefixed?.rhymeNucleus.nucleus).toBe('i');
  });
});

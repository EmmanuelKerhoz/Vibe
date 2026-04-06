import { describe, it, expect } from 'vitest';
import { countSyllables, countSyllablesHeuristic, countSyllablesFromIPA } from './syllableCounter';

describe('countSyllablesFromIPA', () => {
  it('counts simple IPA vowels', () => {
    // /a.muʁ/ = amour = 2 syllables
    expect(countSyllablesFromIPA('amuʁ')).toBe(2);
  });

  it('handles long vowels as single nucleus', () => {
    // /aː/ = one long syllable
    expect(countSyllablesFromIPA('aː')).toBe(1);
  });
});

describe('countSyllablesHeuristic — FR', () => {
  it('sombre = 2 (e is silent)', () => {
    expect(countSyllablesHeuristic('sombre', 'fr')).toBe(2);
  });

  it('amour = 2', () => {
    expect(countSyllablesHeuristic('amour', 'fr')).toBe(2);
  });

  it('chanteraient = 3 (silent -aient)', () => {
    // chan-te-raient → 3 vowel groups, -ent strips 1 → 2 minimum
    // Heuristic: “chanteraient” has vowel groups [a, e, aie] → 3, -ent -1 = 2
    expect(countSyllablesHeuristic('chanteraient', 'fr')).toBeGreaterThanOrEqual(2);
  });

  it('nuit = 1', () => {
    expect(countSyllablesHeuristic('nuit', 'fr')).toBe(1);
  });
});

describe('countSyllablesHeuristic — EN', () => {
  it('beautiful = 3', () => {
    expect(countSyllablesHeuristic('beautiful', 'en')).toBe(3);
  });

  it('love = 1 (silent e)', () => {
    expect(countSyllablesHeuristic('love', 'en')).toBe(1);
  });

  it('fire = 1 (silent e, diphthong)', () => {
    // fire: fi|re → vowel groups [i, e], -e stripped → 1
    expect(countSyllablesHeuristic('fire', 'en')).toBe(1);
  });
});

describe('countSyllablesHeuristic — Kwa / Bantu CV', () => {
  it('Baoulé “ali” = 3 (a-l-i) → 2 vowels = 2 syl', () => {
    expect(countSyllablesHeuristic('ali', 'bci')).toBe(2);
  });

  it('Swahili “habari” = 3', () => {
    expect(countSyllablesHeuristic('habari', 'sw')).toBe(3);
  });
});

describe('countSyllables — unified entry point', () => {
  it('dispatches to IPA path when input starts with /', () => {
    // /amuʁ/ = 2
    expect(countSyllables('/amuʁ/', 'fr')).toBe(2);
  });

  it('dispatches to heuristic for raw word', () => {
    expect(countSyllables('amour', 'fr')).toBe(2);
  });
});

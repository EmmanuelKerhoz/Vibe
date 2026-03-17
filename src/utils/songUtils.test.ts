import { describe, expect, it } from 'vitest';
import { countSyllables, splitRhymingSuffix } from './songUtils';

describe('countSyllables', () => {
  it('ignores punctuation-only tokens', () => {
    expect(countSyllables('...')).toBe(0);
    expect(countSyllables('🎵')).toBe(0);
  });

  it('normalizes accented latin characters before counting syllables', () => {
    expect(countSyllables('canción')).toBe(2);
    expect(countSyllables('señorita')).toBe(4);
  });

  it('preserves the existing english heuristic for plain words', () => {
    expect(countSyllables('hello')).toBe(2);
    expect(countSyllables('made')).toBe(1);
  });
});

describe('splitRhymingSuffix', () => {
  it('highlights the strongest shared ending for plural/singular rhymes', () => {
    expect(
      splitRhymingSuffix(
        'A tous les macho, à tous les possessifs,',
        ['A toutes les go jalouses, voici mon adjectif.'],
      ),
    ).toEqual({
      before: 'A tous les macho, à tous les possess',
      rhyme: 'ifs,',
    });
  });

  it('anchors the shared rime to the common transaction/acquisition ending', () => {
    expect(
      splitRhymingSuffix(
        'Si ton amour est comme une transaction,',
        ['Tu prends son cœur… pour une acquisition.'],
      ),
    ).toEqual({
      before: 'Si ton amour est comme une transac',
      rhyme: 'tion,',
    });
  });

  it('keeps the plural letter visible when a longer peer uses the same rime', () => {
    expect(
      splitRhymingSuffix(
        'Tu veux des preuves, tu veux des certitudes,',
        ['Tu confonds l’amour avec la servitude.'],
      ),
    ).toEqual({
      before: 'Tu veux des preuves, tu veux des cert',
      rhyme: 'itudes,',
    });
  });
});

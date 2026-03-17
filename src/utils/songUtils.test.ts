import { describe, expect, it } from 'vitest';
import { countSyllables } from './songUtils';

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

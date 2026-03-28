import { describe, it, expect } from 'vitest';
import { syllabifyFrenchWord, syllabifyLineFrench, SYLLABLE_SEPARATOR } from './frenchSyllabifier';

const DOT = SYLLABLE_SEPARATOR;

describe('frenchSyllabifier', () => {
  describe('syllabifyFrenchWord', () => {
    it('handles empty string and single char', () => {
      expect(syllabifyFrenchWord('')).toBe('');
      expect(syllabifyFrenchWord('a')).toBe('a');
    });

    it('returns monosyllables unchanged', () => {
      expect(syllabifyFrenchWord('beau')).toBe('beau');
      expect(syllabifyFrenchWord('jour')).toBe('jour');
      expect(syllabifyFrenchWord('gris')).toBe('gris');
    });

    it('splits bonjour → bon·jour', () => {
      expect(syllabifyFrenchWord('bonjour')).toBe(`bon${DOT}jour`);
    });

    it('splits monde → mon·de', () => {
      expect(syllabifyFrenchWord('monde')).toBe(`mon${DOT}de`);
    });

    it('splits chanson → chan·son', () => {
      expect(syllabifyFrenchWord('chanson')).toBe(`chan${DOT}son`);
    });

    it('splits liberté → li·ber·té', () => {
      expect(syllabifyFrenchWord('liberté')).toBe(`li${DOT}ber${DOT}té`);
    });

    it('splits problème → pro·blè·me (valid onset bl stays together)', () => {
      expect(syllabifyFrenchWord('problème')).toBe(`pro${DOT}blè${DOT}me`);
    });

    it('splits comprendre → com·pren·dre (valid onsets pr, dr)', () => {
      expect(syllabifyFrenchWord('comprendre')).toBe(`com${DOT}pren${DOT}dre`);
    });

    it('splits heureux → heu·reux', () => {
      expect(syllabifyFrenchWord('heureux')).toBe(`heu${DOT}reux`);
    });

    it('splits musique → mu·si·que', () => {
      expect(syllabifyFrenchWord('musique')).toBe(`mu${DOT}si${DOT}que`);
    });

    it('splits triste → tris·te', () => {
      expect(syllabifyFrenchWord('triste')).toBe(`tris${DOT}te`);
    });

    it('splits chanter → chan·ter', () => {
      expect(syllabifyFrenchWord('chanter')).toBe(`chan${DOT}ter`);
    });

    it('preserves original casing', () => {
      expect(syllabifyFrenchWord('Bonjour')).toBe(`Bon${DOT}jour`);
      expect(syllabifyFrenchWord('LIBERTÉ')).toBe(`LI${DOT}BER${DOT}TÉ`);
    });

    it('handles eu digraph correctly', () => {
      const result = syllabifyFrenchWord('heureux');
      expect(result).toBe(`heu${DOT}reux`);
    });

    it('handles ou digraph correctly in bonjour', () => {
      const result = syllabifyFrenchWord('bonjour');
      // 'jour' contains 'ou' digraph → single nucleus
      expect(result.split(DOT)).toHaveLength(2);
    });

    it('produces at least the same syllable count as expected for common words', () => {
      const cases: [string, number][] = [
        ['bonjour', 2],
        ['monde', 2],
        ['chanson', 2],
        ['liberté', 3],
        ['problème', 3],
        ['comprendre', 3],
        ['heureux', 2],
        ['musique', 3],
        ['triste', 2],
      ];
      for (const [word, expectedCount] of cases) {
        const result = syllabifyFrenchWord(word);
        const count = result.split(DOT).length;
        expect(count, `syllable count for "${word}"`).toBe(expectedCount);
      }
    });
  });

  describe('syllabifyLineFrench', () => {
    it('handles empty string', () => {
      expect(syllabifyLineFrench('')).toBe('');
    });

    it('splits words in a line while preserving spaces', () => {
      const result = syllabifyLineFrench('bonjour monde');
      expect(result).toBe(`bon${DOT}jour mon${DOT}de`);
    });

    it('preserves punctuation and apostrophes', () => {
      const result = syllabifyLineFrench("c'est la vie");
      expect(result).toContain("'");
      expect(result).toContain(DOT);
    });

    it('preserves hyphens', () => {
      const result = syllabifyLineFrench('peut-être');
      expect(result).toContain('-');
    });

    it('applies syllabification to each word independently', () => {
      const result = syllabifyLineFrench('la liberté chanter');
      // 'la' is monosyllable, 'liberté' → 3 syllables, 'chanter' → 2
      expect(result).toBe(`la li${DOT}ber${DOT}té chan${DOT}ter`);
    });

    it('handles lines with meta/musical direction text', () => {
      const result = syllabifyLineFrench('Aggressive drums:');
      // 'Aggressive' is English but still processed; 'drums' same
      expect(typeof result).toBe('string');
    });
  });
});

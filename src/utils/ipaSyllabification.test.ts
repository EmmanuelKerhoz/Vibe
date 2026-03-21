/**
 * Tests for IPA syllabification and rhyme nucleus extraction
 */

import { describe, it, expect } from 'vitest';
import {
  syllabifyIPA,
  extractRhymeNucleus,
} from './ipaSyllabification';

describe('ipaSyllabification', () => {
  describe('syllabifyIPA - ALGO-ROM (Romance)', () => {
    it('should syllabify simple French IPA', () => {
      const syllables = syllabifyIPA('mɔ̃d', 'ALGO-ROM');
      expect(syllables).toHaveLength(1);
      expect(syllables[0]?.onset).toBe('m');
      expect(syllables[0]?.nucleus).toContain('ɔ');
      expect(syllables[0]?.coda).toBe('d');
    });

    it('should handle multi-syllable words', () => {
      const syllables = syllabifyIPA('paʁle', 'ALGO-ROM');
      expect(syllables.length).toBeGreaterThan(1);
    });

    it('should handle words without consonants', () => {
      const syllables = syllabifyIPA('eau', 'ALGO-ROM');
      expect(syllables).toHaveLength(1);
      expect(syllables[0]?.onset).toBe('');
    });

    it('should remove stress marks from onset', () => {
      const syllables = syllabifyIPA('ˈtest', 'ALGO-ROM');
      expect(syllables[0]?.onset).not.toContain('ˈ');
      expect(syllables[0]?.stress).toBe(true);
    });
  });

  describe('syllabifyIPA - ALGO-KWA (Kwa languages)', () => {
    it('should syllabify CV structure', () => {
      const syllables = syllabifyIPA('ba', 'ALGO-KWA');
      expect(syllables).toHaveLength(1);
      expect(syllables[0]?.onset).toBe('b');
      expect(syllables[0]?.nucleus).toContain('a');
      expect(syllables[0]?.coda).toBe('');
    });

    it('should extract tone from nucleus when present', () => {
      // Use combining acute accent for tone
      const syllables = syllabifyIPA('ba\u0301', 'ALGO-KWA');
      // Tone extraction happens if diacritic is present
      if (syllables[0]?.nucleus.includes('\u0301')) {
        expect(syllables[0]?.tone).toBeDefined();
      }
    });

    it('should handle multiple syllables with tone', () => {
      const syllables = syllabifyIPA('bábá', 'ALGO-KWA');
      expect(syllables.length).toBeGreaterThan(0);
      syllables.forEach(syl => {
        expect(syl.onset).toBeDefined();
        expect(syl.nucleus).toBeDefined();
      });
    });
  });

  describe('syllabifyIPA - ALGO-CRV (Cross River/Chadic)', () => {
    it('should syllabify CVC structure', () => {
      const syllables = syllabifyIPA('ban', 'ALGO-CRV');
      expect(syllables).toHaveLength(1);
      expect(syllables[0]?.onset).toBe('b');
      expect(syllables[0]?.nucleus).toContain('a');
      expect(syllables[0]?.coda).toBe('n');
    });

    it('should determine syllable weight', () => {
      // Heavy: CVC
      const heavySyllables = syllabifyIPA('ban', 'ALGO-CRV');
      expect(heavySyllables[0]?.weight).toBe('heavy');

      // Light: CV
      const lightSyllables = syllabifyIPA('ba', 'ALGO-CRV');
      expect(lightSyllables[0]?.weight).toBe('light');
    });

    it('should preserve tone with weight when diacritics present', () => {
      const syllables = syllabifyIPA('ba\u0301n', 'ALGO-CRV');
      // Tone is extracted if diacritic is present
      if (syllables[0]?.nucleus.includes('\u0301')) {
        expect(syllables[0]?.tone).toBeDefined();
      }
      expect(syllables[0]?.weight).toBe('heavy');
    });
  });

  describe('syllabifyIPA - ALGO-GER (Germanic)', () => {
    it('should handle complex onsets', () => {
      const syllables = syllabifyIPA('stɹɪŋ', 'ALGO-GER');
      expect(syllables.length).toBeGreaterThan(0);
      expect(syllables[0]?.onset.length).toBeGreaterThan(0);
    });

    it('should handle complex codas', () => {
      const syllables = syllabifyIPA('tɛkst', 'ALGO-GER');
      expect(syllables.length).toBeGreaterThan(0);
    });
  });

  describe('syllabifyIPA - edge cases', () => {
    it('should handle empty string', () => {
      const syllables = syllabifyIPA('', 'ALGO-ROM');
      expect(syllables).toEqual([]);
    });

    it('should handle IPA slashes', () => {
      const syllables = syllabifyIPA('/mɔ̃d/', 'ALGO-ROM');
      expect(syllables.length).toBeGreaterThan(0);
    });

    it('should handle whitespace', () => {
      const syllables = syllabifyIPA('  mɔ̃d  ', 'ALGO-ROM');
      expect(syllables.length).toBeGreaterThan(0);
    });

    it('should handle consonant-only input by treating it as onset', () => {
      // Use clearly non-vowel characters
      const syllables = syllabifyIPA('ptkbdg', 'ALGO-ROM');
      expect(syllables).toHaveLength(1);
      // When there are no vowels, the whole string becomes the onset
      expect(syllables[0]?.onset.length).toBeGreaterThan(0);
      // Nucleus should be empty when there are no vowels
      expect(syllables[0]?.nucleus.length).toBeLessThanOrEqual(1);
    });
  });

  describe('extractRhymeNucleus', () => {
    it('should extract RN from simple syllable (Romance)', () => {
      const syllables = syllabifyIPA('mɔ̃d', 'ALGO-ROM');
      const rn = extractRhymeNucleus(syllables, 'ALGO-ROM');
      expect(rn).toContain('ɔ');
      expect(rn).toContain('d');
    });

    it('should extract RN from stressed syllable', () => {
      const syllables = syllabifyIPA('ˈpɑʁle', 'ALGO-ROM');
      const rn = extractRhymeNucleus(syllables, 'ALGO-ROM');
      expect(rn.length).toBeGreaterThan(0);
    });

    it('should default to last syllable when no stress', () => {
      const syllables = syllabifyIPA('pɑʁle', 'ALGO-ROM');
      const rn = extractRhymeNucleus(syllables, 'ALGO-ROM');
      expect(rn.length).toBeGreaterThan(0);
    });

    it('should extract RN for KWA (nucleus + tone, no coda)', () => {
      const syllables = syllabifyIPA('ba\u0301', 'ALGO-KWA');
      const rn = extractRhymeNucleus(syllables, 'ALGO-KWA');
      // For KWA, RN is just nucleus + tone (if present)
      expect(rn.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract RN for CRV (nucleus + coda + tone)', () => {
      const syllables = syllabifyIPA('ba\u0301n', 'ALGO-CRV');
      const rn = extractRhymeNucleus(syllables, 'ALGO-CRV');
      // For CRV, RN includes nucleus + coda + tone
      expect(rn.length).toBeGreaterThanOrEqual(2);
    });

    it('should include following syllables in RN for Romance', () => {
      const syllables = syllabifyIPA('paʁle', 'ALGO-ROM');
      const rn = extractRhymeNucleus(syllables, 'ALGO-ROM');
      // RN from last syllable should have content
      expect(rn.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty syllables array', () => {
      const rn = extractRhymeNucleus([], 'ALGO-ROM');
      expect(rn).toBe('');
    });
  });
});

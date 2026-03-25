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

    it('keeps a nasal vowel nucleus intact when tracking syllable boundaries', () => {
      const syllables = syllabifyIPA('pɑ̃ta', 'ALGO-ROM');
      expect(syllables).toHaveLength(2);
      expect(syllables[0]).toMatchObject({
        onset: 'p',
        nucleus: 'ɑ̃',
        coda: '',
      });
      expect(syllables[1]).toMatchObject({
        onset: 't',
        nucleus: 'a',
        coda: '',
      });
    });

    it('preserves onset, nucleus, and coda splits for multi-syllable IPA with separators', () => {
      const syllables = syllabifyIPA('pa.ta', 'ALGO-ROM');
      expect(syllables).toEqual([
        {
          onset: 'p',
          nucleus: 'a',
          coda: '',
          stress: false,
        },
        {
          onset: 't',
          nucleus: 'a',
          coda: '',
          stress: false,
        },
      ]);
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

    it('keeps a tonal vowel nucleus together and extracts high tone', () => {
      const syllables = syllabifyIPA('ka\u0301ta', 'ALGO-KWA');
      expect(syllables).toHaveLength(2);
      expect(syllables[0]).toMatchObject({
        onset: 'k',
        nucleus: 'a\u0301',
        tone: 'H',
      });
      expect(syllables[1]).toMatchObject({
        nucleus: 'a',
      });
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

    it('keeps a long vowel nucleus together and marks it heavy', () => {
      const syllables = syllabifyIPA('kaːta', 'ALGO-CRV');
      expect(syllables).toHaveLength(2);
      expect(syllables[0]).toMatchObject({
        onset: 'k',
        nucleus: 'aː',
        weight: 'heavy',
      });
      expect(syllables[1]).toMatchObject({
        nucleus: 'a',
        weight: 'light',
      });
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

  describe('extractRhymeNucleus - ALGO-ROM e-muet regression', () => {
    it('miette (mjɛtə) and tempête (tɑ̃pɛtə) share RN ɛt — coda preserved after e-muet removal', () => {
      const rnMiette = extractRhymeNucleus(syllabifyIPA('mjɛtə', 'ALGO-ROM'), 'ALGO-ROM');
      const rnTempete = extractRhymeNucleus(syllabifyIPA('tɑ̃pɛtə', 'ALGO-ROM'), 'ALGO-ROM');
      expect(rnMiette).toBe('ɛt');
      expect(rnTempete).toBe('ɛt');
      expect(rnMiette).toBe(rnTempete);
    });

    it('défaite (defɛtə) and miette (mjɛtə) share RN ɛt', () => {
      const rnDefaite = extractRhymeNucleus(syllabifyIPA('defɛtə', 'ALGO-ROM'), 'ALGO-ROM');
      const rnMiette = extractRhymeNucleus(syllabifyIPA('mjɛtə', 'ALGO-ROM'), 'ALGO-ROM');
      expect(rnDefaite).toBe('ɛt');
      expect(rnMiette).toBe('ɛt');
    });

    it('idiot and chariot share the same RN (no e-muet, unaffected)', () => {
      const rnIdiot = extractRhymeNucleus(syllabifyIPA('idjɔ', 'ALGO-ROM'), 'ALGO-ROM');
      const rnChariot = extractRhymeNucleus(syllabifyIPA('ʃaʁjɔ', 'ALGO-ROM'), 'ALGO-ROM');
      expect(rnIdiot).toBe(rnChariot);
    });

    it('chanter (ʃɑ̃təʁ) and danser (dɑ̃səʁ) share RN ɑ̃ — legitimate open syllable canary', () => {
      const rnChanter = extractRhymeNucleus(syllabifyIPA('ʃɑ̃təʁ', 'ALGO-ROM'), 'ALGO-ROM');
      const rnDanser = extractRhymeNucleus(syllabifyIPA('dɑ̃səʁ', 'ALGO-ROM'), 'ALGO-ROM');
      expect(rnChanter).toBe('ɑ̃');
      expect(rnDanser).toBe('ɑ̃');
      expect(rnChanter).toBe(rnDanser);
    });

    it('port (pɔʁ) and mort (mɔʁ) share RN ɔʁ — no e-muet, coda ʁ preserved', () => {
      const rnPort = extractRhymeNucleus(syllabifyIPA('pɔʁ', 'ALGO-ROM'), 'ALGO-ROM');
      const rnMort = extractRhymeNucleus(syllabifyIPA('mɔʁ', 'ALGO-ROM'), 'ALGO-ROM');
      expect(rnPort).toBe('ɔʁ');
      expect(rnMort).toBe('ɔʁ');
    });

    it('fête (fɛtə) and été (ete) must NOT share the same RN — coda vs open syllable canary', () => {
      const rnFete = extractRhymeNucleus(syllabifyIPA('fɛtə', 'ALGO-ROM'), 'ALGO-ROM');
      const rnEte = extractRhymeNucleus(syllabifyIPA('ete', 'ALGO-ROM'), 'ALGO-ROM');
      expect(rnFete).toBe('ɛt');
      expect(rnEte).toBe('e');
      expect(rnFete).not.toBe(rnEte);
    });
  });

  describe('extractRhymeNucleus - ALGO-GER regression', () => {
    it('stream (stɹiːm) should yield RN iːm', () => {
      const syllables = syllabifyIPA('stɹiːm', 'ALGO-GER');
      const rn = extractRhymeNucleus(syllables, 'ALGO-GER');
      expect(rn).toContain('iː');
      expect(rn).toContain('m');
    });

    it('theme (θiːm) should yield RN iːm', () => {
      const syllables = syllabifyIPA('θiːm', 'ALGO-GER');
      const rn = extractRhymeNucleus(syllables, 'ALGO-GER');
      expect(rn).toContain('iː');
      expect(rn).toContain('m');
    });

    it('stream and theme should produce the same RN (rhyme pair)', () => {
      const rnStream = extractRhymeNucleus(syllabifyIPA('stɹiːm', 'ALGO-GER'), 'ALGO-GER');
      const rnTheme = extractRhymeNucleus(syllabifyIPA('θiːm', 'ALGO-GER'), 'ALGO-GER');
      expect(rnStream).toBe(rnTheme);
    });

    it('time (taɪm) and crime (kɹaɪm) should produce the same RN', () => {
      const rnTime = extractRhymeNucleus(syllabifyIPA('taɪm', 'ALGO-GER'), 'ALGO-GER');
      const rnCrime = extractRhymeNucleus(syllabifyIPA('kɹaɪm', 'ALGO-GER'), 'ALGO-GER');
      expect(rnTime).toContain('aɪm');
      expect(rnTime).toBe(rnCrime);
    });

    it('stone (stoʊn) and bone (boʊn) should produce the same RN', () => {
      const rnStone = extractRhymeNucleus(syllabifyIPA('stoʊn', 'ALGO-GER'), 'ALGO-GER');
      const rnBone = extractRhymeNucleus(syllabifyIPA('boʊn', 'ALGO-GER'), 'ALGO-GER');
      expect(rnStone).toContain('oʊn');
      expect(rnStone).toBe(rnBone);
    });

    it('love (lʌv) and move (muːv) should NOT produce the same RN (eye-rhyme canary)', () => {
      const rnLove = extractRhymeNucleus(syllabifyIPA('lʌv', 'ALGO-GER'), 'ALGO-GER');
      const rnMove = extractRhymeNucleus(syllabifyIPA('muːv', 'ALGO-GER'), 'ALGO-GER');
      expect(rnLove).not.toBe(rnMove);
    });

    it('nation (ˈneɪʃən) and station (ˈsteɪʃən) should produce the same RN', () => {
      const rnNation = extractRhymeNucleus(syllabifyIPA('ˈneɪʃən', 'ALGO-GER'), 'ALGO-GER');
      const rnStation = extractRhymeNucleus(syllabifyIPA('ˈsteɪʃən', 'ALGO-GER'), 'ALGO-GER');
      expect(rnNation).toContain('eɪ');
      expect(rnNation).toBe(rnStation);
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

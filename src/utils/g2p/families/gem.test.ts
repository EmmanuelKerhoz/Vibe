/**
 * Tests for GEM (Germanic) family G2P
 * Covers magic-e coda guard and ALGO-GER rhyme regression pairs
 */

import { describe, it, expect } from 'vitest';
import { gemG2P, lookupEnglishHomophone, isOpenSyllableExpected } from './gem';

describe('gemG2P', () => {
  describe('homophones lookup', () => {
    it('resolves "theme" to the correct IPA (θiːm)', () => {
      expect(gemG2P('theme')).toBe('θiːm');
    });

    it('resolves "stream" to the correct IPA (stɹiːm)', () => {
      expect(gemG2P('stream')).toBe('stɹiːm');
    });

    it('resolves "stone" to the correct IPA (stoʊn)', () => {
      expect(gemG2P('stone')).toBe('stoʊn');
    });

    it('resolves "bone" to the correct IPA (boʊn)', () => {
      expect(gemG2P('bone')).toBe('boʊn');
    });

    it('resolves "move" to the correct IPA (muːv)', () => {
      expect(gemG2P('move')).toBe('muːv');
    });

    it('resolves "love" to the correct IPA (lʌv)', () => {
      expect(gemG2P('love')).toBe('lʌv');
    });

    it('resolves "nation" to the correct IPA (neɪʃən)', () => {
      expect(gemG2P('nation')).toBe('neɪʃən');
    });

    it('resolves "station" to the correct IPA (steɪʃən)', () => {
      expect(gemG2P('station')).toBe('steɪʃən');
    });

    it('resolves "time" to the correct IPA (taɪm)', () => {
      expect(gemG2P('time')).toBe('taɪm');
    });

    it('resolves "crime" to the correct IPA (kɹaɪm)', () => {
      expect(gemG2P('crime')).toBe('kɹaɪm');
    });
  });

  describe('lookupEnglishHomophone', () => {
    it('returns null for unknown words', () => {
      expect(lookupEnglishHomophone('xyznotaword')).toBeNull();
    });

    it('is case-insensitive', () => {
      expect(lookupEnglishHomophone('Theme')).toBe('θiːm');
      expect(lookupEnglishHomophone('THEME')).toBe('θiːm');
    });
  });

  describe('isOpenSyllableExpected (magic-e guard)', () => {
    it('returns true for magic-e words (theme, stone, bone, time)', () => {
      expect(isOpenSyllableExpected('theme')).toBe(true);
      expect(isOpenSyllableExpected('stone')).toBe(true);
      expect(isOpenSyllableExpected('bone')).toBe(true);
      expect(isOpenSyllableExpected('time')).toBe(true);
    });

    it('returns false for words ending in double-vowel + e', () => {
      // "blue", "true", "free" — not magic-e patterns
      expect(isOpenSyllableExpected('true')).toBe(false);
      expect(isOpenSyllableExpected('blue')).toBe(false);
    });

    it('returns false for words without the magic-e pattern', () => {
      expect(isOpenSyllableExpected('stream')).toBe(false);
      expect(isOpenSyllableExpected('cat')).toBe(false);
      expect(isOpenSyllableExpected('play')).toBe(false);
    });
  });
});

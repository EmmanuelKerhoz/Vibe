/**
 * Tests for IPA utilities (phoneme features, distance calculations, rhyme quality)
 */

import { describe, it, expect } from 'vitest';
import {
  getPhonemeFeatures,
  calculateFeatureDistance,
  calculatePhonemeEditDistance,
  calculateFeatureWeightedDistance,
  calculateSimilarityScore,
  classifyRhymeQuality,
  doIPASequencesRhyme,
  calculateRhymeSimilarity,
  isIPAVowel,
  extractTone,
} from './ipaUtils';

describe('ipaUtils', () => {
  describe('getPhonemeFeatures', () => {
    it('should return features for known IPA vowels', () => {
      const features = getPhonemeFeatures('a');
      expect(features).toBeDefined();
      expect(features?.manner).toBe('vowel');
      expect(features?.voicing).toBe('voiced');
      expect(features?.height).toBe('low');
    });

    it('should return features for known IPA consonants', () => {
      const features = getPhonemeFeatures('p');
      expect(features).toBeDefined();
      expect(features?.place).toBe('bilabial');
      expect(features?.manner).toBe('stop');
      expect(features?.voicing).toBe('voiceless');
    });

    it('should return undefined for unknown phonemes', () => {
      const features = getPhonemeFeatures('xyz');
      expect(features).toBeUndefined();
    });

    it('should handle French nasal vowels by stripping diacritics', () => {
      // Note: The function strips combining diacritics for lookup
      // so 'ɔ̃' becomes 'ɔ' and looks up the base phoneme
      const features = getPhonemeFeatures('ɔ̃');
      expect(features).toBeDefined();
      expect(features?.place).toBe('vowel');
    });
  });

  describe('calculateFeatureDistance', () => {
    it('should return 0 for identical phonemes', () => {
      expect(calculateFeatureDistance('a', 'a')).toBe(0);
      expect(calculateFeatureDistance('p', 'p')).toBe(0);
    });

    it('should return positive distance for different phonemes', () => {
      const distance = calculateFeatureDistance('p', 'b');
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1);
    });

    it('should return higher distance for very different phonemes', () => {
      const distanceSimilar = calculateFeatureDistance('p', 'b'); // Only voicing differs
      const distanceDifferent = calculateFeatureDistance('p', 'a'); // Consonant vs vowel
      expect(distanceDifferent).toBeGreaterThan(distanceSimilar);
    });

    it('should return 1.0 for unknown phonemes', () => {
      expect(calculateFeatureDistance('xyz', 'abc')).toBe(1.0);
    });
  });

  describe('calculatePhonemeEditDistance', () => {
    it('should return 0 for identical sequences', () => {
      expect(calculatePhonemeEditDistance('abc', 'abc')).toBe(0);
    });

    it('should calculate insertion distance', () => {
      expect(calculatePhonemeEditDistance('ab', 'abc')).toBe(1);
    });

    it('should calculate deletion distance', () => {
      expect(calculatePhonemeEditDistance('abc', 'ab')).toBe(1);
    });

    it('should calculate substitution distance', () => {
      expect(calculatePhonemeEditDistance('abc', 'adc')).toBe(1);
    });

    it('should handle complex differences', () => {
      const distance = calculatePhonemeEditDistance('monde', 'mɔ̃d');
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('calculateSimilarityScore', () => {
    it('should return 1.0 for zero distance', () => {
      expect(calculateSimilarityScore(0, 5)).toBe(1.0);
    });

    it('should return 0 for maximum distance', () => {
      expect(calculateSimilarityScore(5, 5)).toBe(0);
    });

    it('should return intermediate scores', () => {
      const score = calculateSimilarityScore(2, 10);
      expect(score).toBe(0.8);
    });

    it('should return 1.0 for zero-length sequences', () => {
      expect(calculateSimilarityScore(0, 0)).toBe(1.0);
    });
  });

  describe('classifyRhymeQuality', () => {
    it('should classify rich rhymes', () => {
      expect(classifyRhymeQuality(0.95)).toBe('rich');
      expect(classifyRhymeQuality(1.0)).toBe('rich');
    });

    it('should classify sufficient rhymes', () => {
      expect(classifyRhymeQuality(0.85)).toBe('sufficient');
      expect(classifyRhymeQuality(0.90)).toBe('sufficient');
    });

    it('should classify assonance', () => {
      expect(classifyRhymeQuality(0.60)).toBe('assonance');
      expect(classifyRhymeQuality(0.75)).toBe('assonance');
    });

    it('should classify weak rhymes', () => {
      expect(classifyRhymeQuality(0.40)).toBe('weak');
      expect(classifyRhymeQuality(0.55)).toBe('weak');
    });

    it('should classify non-rhymes', () => {
      expect(classifyRhymeQuality(0.0)).toBe('none');
      expect(classifyRhymeQuality(0.3)).toBe('none');
    });
  });

  describe('doIPASequencesRhyme', () => {
    it('should return true for identical sequences', () => {
      expect(doIPASequencesRhyme('abc', 'abc')).toBe(true);
    });

    it('should return false for empty sequences', () => {
      expect(doIPASequencesRhyme('', 'abc')).toBe(false);
      expect(doIPASequencesRhyme('abc', '')).toBe(false);
    });

    it('should use threshold correctly', () => {
      // Same sequences should always rhyme
      expect(doIPASequencesRhyme('test', 'test', 0.9)).toBe(true);
    });

    it('should handle feature-weighted vs simple PED', () => {
      const ipa1 = 'ɔ̃d';
      const ipa2 = 'ɔ̃t';

      // Should rhyme with feature weighting (d/t differ only in voicing)
      expect(doIPASequencesRhyme(ipa1, ipa2, 0.75, true)).toBe(true);
    });
  });

  describe('calculateRhymeSimilarity', () => {
    it('should return perfect score for identical sequences', () => {
      const result = calculateRhymeSimilarity('monde', 'monde');
      expect(result.score).toBe(1.0);
      expect(result.quality).toBe('rich');
      expect(result.distance).toBe(0);
      expect(result.method).toBe('exact');
    });

    it('should return zero score for empty sequences', () => {
      const result = calculateRhymeSimilarity('', 'monde');
      expect(result.score).toBe(0);
      expect(result.quality).toBe('none');
      expect(result.distance).toBe(Infinity);
    });

    it('should calculate similarity with feature weighting', () => {
      const result = calculateRhymeSimilarity('ɔ̃d', 'ɔ̃t', true);
      expect(result.method).toBe('feature-weighted');
      expect(result.score).toBeGreaterThan(0);
      expect(result.quality).toBeDefined();
    });

    it('should calculate similarity without feature weighting', () => {
      const result = calculateRhymeSimilarity('abc', 'abd', false);
      expect(result.method).toBe('phoneme-edit');
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('isIPAVowel', () => {
    it('should identify common IPA vowels', () => {
      expect(isIPAVowel('a')).toBe(true);
      expect(isIPAVowel('e')).toBe(true);
      expect(isIPAVowel('i')).toBe(true);
      expect(isIPAVowel('o')).toBe(true);
      expect(isIPAVowel('u')).toBe(true);
    });

    it('should identify extended IPA vowels', () => {
      expect(isIPAVowel('ɛ')).toBe(true);
      expect(isIPAVowel('ɔ')).toBe(true);
      expect(isIPAVowel('ə')).toBe(true);
    });

    it('should reject consonants', () => {
      expect(isIPAVowel('p')).toBe(false);
      expect(isIPAVowel('t')).toBe(false);
      expect(isIPAVowel('k')).toBe(false);
    });
  });

  describe('extractTone', () => {
    it('should extract high tone from combining diacritics', () => {
      // Use combining acute accent (U+0301) after base character
      const highTone = 'a\u0301';
      expect(extractTone(highTone)).toBe('H');
    });

    it('should extract low tone from combining diacritics', () => {
      // Use combining grave accent (U+0300) after base character
      const lowTone = 'a\u0300';
      expect(extractTone(lowTone)).toBe('L');
    });

    it('should extract falling tone from combining diacritics', () => {
      // Use combining circumflex (U+0302) after base character
      const fallingTone = 'a\u0302';
      expect(extractTone(fallingTone)).toBe('F');
    });

    it('should extract mid tone from combining diacritics', () => {
      // Use combining tilde (U+0303) after base character
      const midTone = 'a\u0303';
      expect(extractTone(midTone)).toBe('M');
    });

    it('should extract rising tone from combining diacritics', () => {
      // Use combining caron (U+030C) after base character
      const risingTone = 'a\u030C';
      expect(extractTone(risingTone)).toBe('R');
    });

    it('should return undefined for non-tonal phonemes', () => {
      expect(extractTone('a')).toBeUndefined();
      expect(extractTone('p')).toBeUndefined();
    });
  });
});

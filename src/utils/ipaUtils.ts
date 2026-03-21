/**
 * IPA (International Phonetic Alphabet) utilities for phonemic processing
 * Based on docs_fusion_optimal.md specification - Step 5 (Scoring phonologique)
 *
 * This module provides:
 * - Phoneme feature extraction (place, manner, voicing, nasality, tone)
 * - Phoneme Edit Distance (PED)
 * - Feature-weighted Levenshtein distance
 * - Rhyme quality categorization
 */

/**
 * Phoneme features based on PHOIBLE classification
 */
export interface PhonemeFeatures {
  /** Place of articulation: bilabial, alveolar, velar, etc. */
  place: string;
  /** Manner of articulation: stop, fricative, nasal, vowel, etc. */
  manner: string;
  /** Voicing: voiced, voiceless */
  voicing: string;
  /** Nasality: nasal, oral */
  nasality: string;
  /** Tone (for tonal languages): H, L, M, R, F, etc. */
  tone?: string;
  /** Vowel height: high, mid, low (for vowels) */
  height?: string;
  /** Vowel backness: front, central, back (for vowels) */
  backness?: string;
  /** Roundedness: rounded, unrounded (for vowels) */
  rounded?: string;
}

/**
 * Simplified phoneme feature database
 * Maps IPA symbols to articulatory features
 */
const PHONEME_FEATURES: Record<string, PhonemeFeatures> = {
  // Vowels
  'i': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'front', rounded: 'unrounded' },
  'e': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'front', rounded: 'unrounded' },
  'ɛ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'front', rounded: 'unrounded' },
  'a': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'low', backness: 'central', rounded: 'unrounded' },
  'ɑ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'low', backness: 'back', rounded: 'unrounded' },
  'ɔ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'back', rounded: 'rounded' },
  'o': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'back', rounded: 'rounded' },
  'u': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'back', rounded: 'rounded' },
  'y': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'front', rounded: 'rounded' },
  'ø': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'front', rounded: 'rounded' },
  'œ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'front', rounded: 'rounded' },
  'ə': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'central', rounded: 'unrounded' },
  'ɨ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'central', rounded: 'unrounded' },
  'ʊ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'back', rounded: 'rounded' },

  // Nasal vowels (French)
  'ɛ̃': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'nasal', height: 'mid', backness: 'front', rounded: 'unrounded' },
  'ɑ̃': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'nasal', height: 'low', backness: 'back', rounded: 'unrounded' },
  'ɔ̃': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'nasal', height: 'mid', backness: 'back', rounded: 'rounded' },
  'œ̃': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'nasal', height: 'mid', backness: 'front', rounded: 'rounded' },

  // Stops
  'p': { place: 'bilabial', manner: 'stop', voicing: 'voiceless', nasality: 'oral' },
  'b': { place: 'bilabial', manner: 'stop', voicing: 'voiced', nasality: 'oral' },
  't': { place: 'alveolar', manner: 'stop', voicing: 'voiceless', nasality: 'oral' },
  'd': { place: 'alveolar', manner: 'stop', voicing: 'voiced', nasality: 'oral' },
  'k': { place: 'velar', manner: 'stop', voicing: 'voiceless', nasality: 'oral' },
  'g': { place: 'velar', manner: 'stop', voicing: 'voiced', nasality: 'oral' },
  'ʔ': { place: 'glottal', manner: 'stop', voicing: 'voiceless', nasality: 'oral' },

  // Fricatives
  'f': { place: 'labiodental', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'v': { place: 'labiodental', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  's': { place: 'alveolar', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'z': { place: 'alveolar', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  'ʃ': { place: 'postalveolar', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'ʒ': { place: 'postalveolar', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  'h': { place: 'glottal', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'x': { place: 'velar', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'ɣ': { place: 'velar', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  'θ': { place: 'dental', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'ð': { place: 'dental', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },

  // Nasals
  'm': { place: 'bilabial', manner: 'nasal', voicing: 'voiced', nasality: 'nasal' },
  'n': { place: 'alveolar', manner: 'nasal', voicing: 'voiced', nasality: 'nasal' },
  'ɲ': { place: 'palatal', manner: 'nasal', voicing: 'voiced', nasality: 'nasal' },
  'ŋ': { place: 'velar', manner: 'nasal', voicing: 'voiced', nasality: 'nasal' },

  // Liquids
  'l': { place: 'alveolar', manner: 'lateral', voicing: 'voiced', nasality: 'oral' },
  'ʎ': { place: 'palatal', manner: 'lateral', voicing: 'voiced', nasality: 'oral' },
  'r': { place: 'alveolar', manner: 'trill', voicing: 'voiced', nasality: 'oral' },
  'ʁ': { place: 'uvular', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  'ɹ': { place: 'alveolar', manner: 'approximant', voicing: 'voiced', nasality: 'oral' },

  // Approximants
  'j': { place: 'palatal', manner: 'approximant', voicing: 'voiced', nasality: 'oral' },
  'w': { place: 'labio-velar', manner: 'approximant', voicing: 'voiced', nasality: 'oral' },
  'ɥ': { place: 'labio-palatal', manner: 'approximant', voicing: 'voiced', nasality: 'oral' },
};

/**
 * Get phoneme features for an IPA symbol
 * Returns undefined if phoneme is not in database
 */
export const getPhonemeFeatures = (phoneme: string): PhonemeFeatures | undefined => {
  // Strip tone diacritics and stress marks for lookup
  const cleanPhoneme = phoneme
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritics
    .replace(/[ˈˌː]/g, ''); // Remove stress and length marks

  return PHONEME_FEATURES[cleanPhoneme];
};

/**
 * Calculate feature distance between two phonemes (0 = identical, 1 = maximally different)
 * Uses weighted sum of feature differences
 */
export const calculateFeatureDistance = (p1: string, p2: string): number => {
  if (p1 === p2) return 0;

  const f1 = getPhonemeFeatures(p1);
  const f2 = getPhonemeFeatures(p2);

  // If either phoneme is unknown, use maximum distance
  if (!f1 || !f2) return 1.0;

  // Feature weights (based on perceptual importance)
  const weights = {
    manner: 0.30,
    place: 0.25,
    voicing: 0.20,
    nasality: 0.15,
    height: 0.10,
    backness: 0.05,
    rounded: 0.05,
  };

  let distance = 0;
  let totalWeight = 0;

  // Compare each feature
  if (f1.manner !== f2.manner) {
    distance += weights.manner;
  }
  totalWeight += weights.manner;

  if (f1.place !== f2.place) {
    distance += weights.place;
  }
  totalWeight += weights.place;

  if (f1.voicing !== f2.voicing) {
    distance += weights.voicing;
  }
  totalWeight += weights.voicing;

  if (f1.nasality !== f2.nasality) {
    distance += weights.nasality;
  }
  totalWeight += weights.nasality;

  // Vowel-specific features
  if (f1.height && f2.height) {
    if (f1.height !== f2.height) {
      distance += weights.height;
    }
    totalWeight += weights.height;

    if (f1.backness && f2.backness && f1.backness !== f2.backness) {
      distance += weights.backness;
    }
    totalWeight += weights.backness;

    if (f1.rounded && f2.rounded && f1.rounded !== f2.rounded) {
      distance += weights.rounded;
    }
    totalWeight += weights.rounded;
  }

  return totalWeight > 0 ? distance / totalWeight : 1.0;
};

/**
 * Calculate Phoneme Edit Distance (PED) - simple Levenshtein on IPA sequences
 */
export const calculatePhonemeEditDistance = (ipa1: string, ipa2: string): number => {
  const phonemes1 = Array.from(ipa1);
  const phonemes2 = Array.from(ipa2);

  const m = phonemes1.length;
  const n = phonemes2.length;

  // Create distance matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = phonemes1[i - 1] === phonemes2[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,      // deletion
        dp[i]![j - 1]! + 1,      // insertion
        dp[i - 1]![j - 1]! + cost // substitution
      );
    }
  }

  return dp[m]![n]!;
};

/**
 * Calculate feature-weighted Levenshtein distance
 * Substitution cost is based on phoneme feature similarity
 */
export const calculateFeatureWeightedDistance = (ipa1: string, ipa2: string): number => {
  const phonemes1 = Array.from(ipa1);
  const phonemes2 = Array.from(ipa2);

  const m = phonemes1.length;
  const n = phonemes2.length;

  // Create distance matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  // Fill matrix with feature-weighted costs
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const p1 = phonemes1[i - 1]!;
      const p2 = phonemes2[j - 1]!;

      // Substitution cost based on feature distance
      const substitutionCost = calculateFeatureDistance(p1, p2);

      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,                    // deletion
        dp[i]![j - 1]! + 1,                    // insertion
        dp[i - 1]![j - 1]! + substitutionCost  // substitution
      );
    }
  }

  return dp[m]![n]!;
};

/**
 * Calculate similarity score from distance (0-1 scale, 1 = identical)
 */
export const calculateSimilarityScore = (distance: number, maxLength: number): number => {
  if (maxLength === 0) return 1.0;
  return Math.max(0, 1 - distance / maxLength);
};

/**
 * Rhyme quality categories based on similarity score
 */
export type RhymeQuality = 'rich' | 'sufficient' | 'assonance' | 'weak' | 'none';

/**
 * Classify rhyme quality based on IPA similarity score
 * Based on spec thresholds in docs_fusion_optimal.md
 */
export const classifyRhymeQuality = (score: number): RhymeQuality => {
  if (score >= 0.95) return 'rich';       // Rime riche: score ≥ 0.95
  if (score >= 0.85) return 'sufficient'; // Rime suffisante: score ≥ 0.85
  if (score >= 0.60) return 'assonance';  // Assonance: nucleus proche, coda divergente
  if (score >= 0.40) return 'weak';       // Rime faible
  return 'none';
};

/**
 * Check if two IPA sequences rhyme based on similarity threshold
 * Default threshold: 0.75 (as per spec)
 */
export const doIPASequencesRhyme = (
  ipa1: string,
  ipa2: string,
  threshold = 0.75,
  useFeatureWeighted = true
): boolean => {
  if (!ipa1 || !ipa2) return false;
  if (ipa1 === ipa2) return true;

  const distance = useFeatureWeighted
    ? calculateFeatureWeightedDistance(ipa1, ipa2)
    : calculatePhonemeEditDistance(ipa1, ipa2);

  const maxLength = Math.max(ipa1.length, ipa2.length);
  const score = calculateSimilarityScore(distance, maxLength);

  return score >= threshold;
};

/**
 * Calculate detailed rhyme similarity with quality classification
 */
export interface RhymeSimilarityResult {
  score: number;
  quality: RhymeQuality;
  distance: number;
  method: 'feature-weighted' | 'phoneme-edit' | 'exact';
}

export const calculateRhymeSimilarity = (
  ipa1: string,
  ipa2: string,
  useFeatureWeighted = true
): RhymeSimilarityResult => {
  if (!ipa1 || !ipa2) {
    return {
      score: 0,
      quality: 'none',
      distance: Infinity,
      method: 'exact',
    };
  }

  if (ipa1 === ipa2) {
    return {
      score: 1.0,
      quality: 'rich',
      distance: 0,
      method: 'exact',
    };
  }

  const distance = useFeatureWeighted
    ? calculateFeatureWeightedDistance(ipa1, ipa2)
    : calculatePhonemeEditDistance(ipa1, ipa2);

  const maxLength = Math.max(ipa1.length, ipa2.length);
  const score = calculateSimilarityScore(distance, maxLength);
  const quality = classifyRhymeQuality(score);

  return {
    score,
    quality,
    distance,
    method: useFeatureWeighted ? 'feature-weighted' : 'phoneme-edit',
  };
};

/**
 * Check if a character is a vowel in IPA
 */
export const isIPAVowel = (char: string): boolean => {
  const vowels = 'iɪeɛæaɑɒɔoʊuʉɨəɜɞʌyøœɶɘɵɤɯ';
  return vowels.includes(char);
};

/**
 * Extract tone from IPA phoneme (for tonal languages)
 * Returns tone symbol or undefined
 */
export const extractTone = (phoneme: string): string | undefined => {
  // Common tone diacritics
  const toneDiacritics: Record<string, string> = {
    '\u0300': 'L',  // Grave = low tone
    '\u0301': 'H',  // Acute = high tone
    '\u0302': 'F',  // Circumflex = falling tone
    '\u0303': 'M',  // Tilde = mid tone
    '\u0304': 'M',  // Macron = level/mid tone
    '\u030C': 'R',  // Caron = rising tone
  };

  for (const [diacritic, tone] of Object.entries(toneDiacritics)) {
    if (phoneme.includes(diacritic)) {
      return tone;
    }
  }

  return undefined;
};

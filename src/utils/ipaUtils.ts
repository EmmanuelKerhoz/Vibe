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

import { PHONEME_FEATURES, type PhonemeFeatures } from './ipaData';

export type { PhonemeFeatures } from './ipaData';

/**
 * Get phoneme features for an IPA symbol
 * Returns undefined if phoneme is not in database
 */
export const getPhonemeFeatures = (phoneme: string): PhonemeFeatures | undefined => {
  const nfcPhoneme = phoneme.normalize('NFC');

  if (PHONEME_FEATURES[nfcPhoneme]) {
    return PHONEME_FEATURES[nfcPhoneme];
  }

  const cleanPhoneme = nfcPhoneme
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
 * Extended to support 5-tone systems (Baoulé, Ewe) with MH/ML distinction
 */
export const extractTone = (phoneme: string, previousConsonant?: string): string | undefined => {
  // Common tone diacritics
  const toneDiacritics: Record<string, string> = {
    '\u0300': 'L',  // Grave = low tone
    '\u0301': 'H',  // Acute = high tone (may become MH in post-voiced context)
    '\u0302': 'F',  // Circumflex = falling tone
    '\u0303': 'M',  // Tilde = mid tone
    '\u0304': 'M',  // Macron = level/mid tone
    '\u030C': 'R',  // Caron = rising tone
  };

  for (const [diacritic, tone] of Object.entries(toneDiacritics)) {
    if (phoneme.includes(diacritic)) {
      // Check for post-voiced depression in KWA languages (Ewe)
      // After b, d, g, gb, v, z: H → MH
      if (tone === 'H' && previousConsonant) {
        const voicedStops = /[bdgvz]|ɡb|gb/;
        if (voicedStops.test(previousConsonant)) {
          return 'MH'; // Mid-high (depressed high tone)
        }
      }
      return tone;
    }
  }

  return undefined;
};

/**
 * Check if a consonant triggers tone depression in KWA languages
 */
export const isVoicedDepressionTrigger = (consonant: string): boolean => {
  const voicedConsonants = /[bdgvz]|ɡb|gb/;
  return voicedConsonants.test(consonant);
};

/**
 * Enhanced rhyme similarity calculation that includes syllable weight for CRV family
 * This is used for Hausa and other CRV languages where bimoraic weight affects rhyming
 *
 * @param ipa1 - First IPA rhyme nucleus
 * @param ipa2 - Second IPA rhyme nucleus
 * @param weight1 - Syllable weight for first nucleus (light/heavy)
 * @param weight2 - Syllable weight for second nucleus (light/heavy)
 * @param useFeatureWeighted - Whether to use feature-weighted distance
 */
export const calculateRhymeSimilarityWithWeight = (
  ipa1: string,
  ipa2: string,
  weight1?: 'light' | 'heavy',
  weight2?: 'light' | 'heavy',
  useFeatureWeighted = true
): RhymeSimilarityResult => {
  // First calculate base similarity
  const baseSimilarity = calculateRhymeSimilarity(ipa1, ipa2, useFeatureWeighted);

  // If no weight information provided, return base similarity
  if (!weight1 || !weight2) {
    return baseSimilarity;
  }

  // For CRV family: weight mismatch reduces rhyme quality
  // Heavy vs Light syllables have different prosodic properties
  // According to spec: Hausa contour HL appears on heavy syllables (bimoraic)
  const weightMatch = weight1 === weight2;

  if (!weightMatch) {
    // Reduce score for weight mismatch (penalty of ~0.1)
    const penalizedScore = Math.max(0, baseSimilarity.score - 0.1);
    const penalizedQuality = classifyRhymeQuality(penalizedScore);

    return {
      ...baseSimilarity,
      score: penalizedScore,
      quality: penalizedQuality,
    };
  }

  return baseSimilarity;
};


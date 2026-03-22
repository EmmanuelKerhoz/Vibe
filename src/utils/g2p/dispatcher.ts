/**
 * G2P Dispatcher - Single entry point for all G2P operations
 * Replaces the monolithic g2pUtils.ts with modular family-based dispatch
 */

import type { AlgoFamily } from '../../constants/langFamilyMap';

// Import family-specific implementations
import { romG2P, removeFrenchSilentE, applyFrenchLiaison, FRENCH_OBLIGATORY_LIAISONS } from './families/rom';
import { gemG2P, lookupEnglishHomophone, ENGLISH_LYRICAL_HOMOPHONES } from './families/gem';
import { kwaG2P, applyEwePostVoicedDepression, normalizeToneTo2Classes, applyEweVowelHarmony } from './families/kwa';
import { crvG2P, detectCRVLongVowels, shouldHaveHLContour } from './families/crv';
import { semG2P } from './families/sem';
import {
  slvG2P,
  sinG2P,
  japG2P,
  korG2P,
  bntG2P,
  iirG2P,
  drvG2P,
  trkG2P,
  finG2P,
  taiG2P,
  vietG2P,
  ausG2P,
} from './families/proxies';

/**
 * Simple grapheme-to-IPA conversion with family dispatch
 * This is a very basic implementation for client-side fallback
 */
const graphemeToIPAFallback = (text: string, family: AlgoFamily): string => {
  const normalized = text.toLowerCase().normalize('NFD');

  // Dispatch to family-specific implementation
  switch (family) {
    case 'ALGO-ROM':
      return romG2P(normalized);

    case 'ALGO-GER':
      return gemG2P(normalized);

    case 'ALGO-KWA':
      return kwaG2P(normalized);

    case 'ALGO-CRV':
      return crvG2P(normalized);

    case 'ALGO-SLV':
      return slvG2P(normalized);

    case 'ALGO-SEM':
      return semG2P(normalized);

    case 'ALGO-SIN':
      return sinG2P(normalized);

    case 'ALGO-JAP':
      return japG2P(normalized);

    case 'ALGO-KOR':
      return korG2P(normalized);

    case 'ALGO-BNT':
      return bntG2P(normalized);

    case 'ALGO-IIR':
      return iirG2P(normalized);

    case 'ALGO-DRV':
      return drvG2P(normalized);

    case 'ALGO-TRK':
      return trkG2P(normalized);

    case 'ALGO-FIN':
      return finG2P(normalized);

    case 'ALGO-TAI':
      return taiG2P(normalized);

    case 'ALGO-VIET':
      return vietG2P(normalized);

    case 'ALGO-AUS':
      return ausG2P(normalized);

    default:
      // Generic fallback: just use the text as-is
      return normalized;
  }
};

/**
 * Client-side G2P conversion with family dispatch
 * Returns approximate IPA representation
 */
export const graphemeToIPA = (text: string, family: AlgoFamily): string => {
  if (!text || !text.trim()) return '';

  // For now, all families use the fallback
  // In the future, this could call family-specific converters
  return graphemeToIPAFallback(text, family);
};

/**
 * Check if text looks like it's already in IPA
 * (contains IPA-specific characters)
 */
export const looksLikeIPA = (text: string): boolean => {
  // Common IPA characters not found in normal text
  const ipaChars = /[ɑɔɛœøɪʊʌəɨɵɜɞɐʉɯɤʎɲŋʃʒθðʁɹ]/;
  return ipaChars.test(text);
};

/**
 * Normalize text for G2P conversion
 * Handles Unicode normalization and cleanup
 */
export const normalizeForG2P = (text: string): string => {
  return text
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\u0300-\u036f]/gu, '') // Keep letters, numbers, spaces, diacritics
    .trim();
};

/**
 * Split text into words for G2P processing
 */
export const splitIntoWords = (text: string): string[] => {
  return normalizeForG2P(text)
    .split(/\s+/)
    .filter(Boolean);
};

/**
 * Convert multiple words to IPA
 */
export const wordsToIPA = (words: string[], family: AlgoFamily): string[] => {
  return words.map(word => graphemeToIPA(word, family));
};

/**
 * Convert text to IPA with word boundaries preserved
 */
export const textToIPAWithBoundaries = (text: string, family: AlgoFamily): string => {
  const words = splitIntoWords(text);
  const ipaWords = wordsToIPA(words, family);
  return ipaWords.join(' ');
};

// Re-export family-specific utilities for backward compatibility
export {
  // French (ROM)
  removeFrenchSilentE,
  applyFrenchLiaison,
  FRENCH_OBLIGATORY_LIAISONS,

  // English (GEM)
  lookupEnglishHomophone,
  ENGLISH_LYRICAL_HOMOPHONES,

  // Ewe/KWA
  applyEwePostVoicedDepression,
  normalizeToneTo2Classes,
  applyEweVowelHarmony,

  // Hausa/CRV
  detectCRVLongVowels,
  shouldHaveHLContour,
};

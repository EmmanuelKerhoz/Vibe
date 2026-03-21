/**
 * Client-side G2P (Grapheme-to-Phoneme) utilities
 * Implements Step 2 of the IPA pipeline: grapheme → IPA conversion
 *
 * This provides client-side fallback when the phonemization microservice is unavailable.
 * Uses simplified graphemic approximations of IPA.
 *
 * Based on docs_fusion_optimal.md specification
 */

import type { AlgoFamily } from '../constants/langFamilyMap';

/**
 * French grapheme-to-IPA mapping (simplified)
 * Full implementation would use epitran or similar
 */
const FRENCH_G2P: Record<string, string> = {
  // Vowels
  'a': 'a',
  'à': 'a',
  'â': 'ɑ',
  'e': 'ə',
  'é': 'e',
  'è': 'ɛ',
  'ê': 'ɛ',
  'ë': 'ɛ',
  'i': 'i',
  'î': 'i',
  'ï': 'i',
  'o': 'o',
  'ô': 'o',
  'u': 'y',
  'ù': 'y',
  'û': 'y',
  'ü': 'y',
  'y': 'i',

  // Digraphs
  'ou': 'u',
  'au': 'o',
  'eau': 'o',
  'eu': 'ø',
  'œu': 'œ',
  'oe': 'ø',
  'ai': 'ɛ',
  'ei': 'ɛ',
  'oi': 'wa',

  // Nasal vowels
  'an': 'ɑ̃',
  'am': 'ɑ̃',
  'en': 'ɑ̃',
  'em': 'ɑ̃',
  'in': 'ɛ̃',
  'im': 'ɛ̃',
  'ain': 'ɛ̃',
  'ein': 'ɛ̃',
  'un': 'œ̃',
  'um': 'œ̃',
  'on': 'ɔ̃',
  'om': 'ɔ̃',

  // Consonants
  'b': 'b',
  'c': 'k',
  'ç': 's',
  'd': 'd',
  'f': 'f',
  'g': 'g',
  'h': '',
  'j': 'ʒ',
  'k': 'k',
  'l': 'l',
  'm': 'm',
  'n': 'n',
  'p': 'p',
  'q': 'k',
  'r': 'ʁ',
  's': 's',
  't': 't',
  'v': 'v',
  'w': 'w',
  'x': 'ks',
  'z': 'z',

  // Digraph consonants
  'ch': 'ʃ',
  'gn': 'ɲ',
  'ph': 'f',
  'th': 't',
};

/**
 * English grapheme-to-IPA mapping (very simplified)
 * Full implementation would use CMU dict + neural OOV
 */
const ENGLISH_G2P: Record<string, string> = {
  'a': 'æ',
  'e': 'ɛ',
  'i': 'ɪ',
  'o': 'ɑ',
  'u': 'ʌ',
  'b': 'b',
  'c': 'k',
  'd': 'd',
  'f': 'f',
  'g': 'g',
  'h': 'h',
  'j': 'dʒ',
  'k': 'k',
  'l': 'l',
  'm': 'm',
  'n': 'n',
  'p': 'p',
  'q': 'k',
  'r': 'ɹ',
  's': 's',
  't': 't',
  'v': 'v',
  'w': 'w',
  'x': 'ks',
  'y': 'j',
  'z': 'z',

  // Common digraphs
  'th': 'θ',
  'sh': 'ʃ',
  'ch': 'tʃ',
  'ng': 'ŋ',
  'ee': 'i',
  'oo': 'u',
  'ou': 'aʊ',
  'ow': 'aʊ',
};

/**
 * Simple grapheme-to-IPA conversion with fallback
 * This is a very basic implementation for client-side fallback
 */
const graphemeToIPAFallback = (text: string, family: AlgoFamily): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  // Select mapping based on family
  let mapping: Record<string, string> = {};

  switch (family) {
    case 'ALGO-ROM':
      // Use French as proxy for Romance
      mapping = FRENCH_G2P;
      break;

    case 'ALGO-GER':
      // Use English as proxy for Germanic
      mapping = ENGLISH_G2P;
      break;

    default:
      // Generic fallback: just use the text as-is
      return normalized;
  }

  // Process text character by character with lookahead for digraphs
  while (i < normalized.length) {
    // Try 3-char, 2-char, then 1-char matches
    let matched = false;

    for (let len = 3; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr]) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Skip unknown characters (diacritics, punctuation)
      if (!/[\u0300-\u036f\s]/.test(normalized[i]!)) {
        ipa += normalized[i];
      }
      i++;
    }
  }

  return ipa;
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

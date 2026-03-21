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
 * KWA family (Baoulé, Dioula, Ewe, Mina) grapheme-to-IPA mapping
 * CV structure with tone marking preserved
 * Simplified mapping - full implementation would use language-specific rules
 */
const KWA_G2P: Record<string, string> = {
  // Vowels - 7-vowel system common in Kwa languages
  'a': 'a',
  'e': 'e',
  'ɛ': 'ɛ',
  'i': 'i',
  'o': 'o',
  'ɔ': 'ɔ',
  'u': 'u',

  // Consonants - common inventory
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
  'ɲ': 'ɲ',
  'ŋ': 'ŋ',
  'p': 'p',
  'r': 'r',
  's': 's',
  't': 't',
  'v': 'v',
  'w': 'w',
  'y': 'j',
  'z': 'z',

  // Digraphs
  'gb': 'ɡb',
  'kp': 'kp',
  'ny': 'ɲ',
  'ng': 'ŋ',
};

/**
 * CRV family (Hausa, Cross River) grapheme-to-IPA mapping
 * CVC structure with tone and glottalization
 * Simplified mapping - full implementation would use language-specific rules
 */
const CRV_G2P: Record<string, string> = {
  // Vowels - typically 5-vowel system with length distinction
  'a': 'a',
  'e': 'e',
  'i': 'i',
  'o': 'o',
  'u': 'u',
  'aa': 'aː',
  'ee': 'eː',
  'ii': 'iː',
  'oo': 'oː',
  'uu': 'uː',

  // Consonants - includes glottalized consonants (Hausa)
  'b': 'b',
  'ɓ': 'ɓ',  // Implosive b
  'c': 'k',
  'd': 'd',
  'ɗ': 'ɗ',  // Implosive d
  'f': 'f',
  'g': 'g',
  'h': 'h',
  'j': 'dʒ',
  'k': 'k',
  'ƙ': 'kʼ', // Ejective k (Hausa)
  'l': 'l',
  'm': 'm',
  'n': 'n',
  'p': 'p',
  'r': 'r',
  'ɽ': 'ɽ',  // Retroflex flap
  's': 's',
  't': 't',
  'v': 'v',
  'w': 'w',
  'y': 'j',
  'ƴ': 'ʔʲ', // Glottalized y (Hausa)
  'z': 'z',

  // Digraphs
  'ts': 'ʦ',
  'sh': 'ʃ',
  'ng': 'ŋ',
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

    case 'ALGO-KWA':
      // KWA family (Baoulé, Dioula, Ewe, Mina)
      mapping = KWA_G2P;
      break;

    case 'ALGO-CRV':
      // CRV family (Hausa, Bekwarra, Calabari, Ogoja)
      mapping = CRV_G2P;
      break;

    case 'ALGO-SLV':
      // Slavic: use English as rough approximation
      mapping = ENGLISH_G2P;
      break;

    case 'ALGO-SEM':
      // Semitic: use French vowels + English consonants as approximation
      mapping = { ...FRENCH_G2P, ...ENGLISH_G2P };
      break;

    case 'ALGO-SIN':
      // Sinitic: preserve tones, use basic vowel mapping
      mapping = { 'a': 'a', 'e': 'ə', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      break;

    case 'ALGO-JAP':
      // Japanese: use basic CV mapping
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'ɯ', ...ENGLISH_G2P };
      break;

    case 'ALGO-KOR':
      // Korean: use basic mapping
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      break;

    case 'ALGO-BNT':
      // Bantu: similar to KWA but with different inventory
      mapping = KWA_G2P;
      break;

    case 'ALGO-IIR':
      // Indo-Iranian: use English as approximation
      mapping = ENGLISH_G2P;
      break;

    case 'ALGO-DRV':
      // Dravidian: use English as approximation
      mapping = ENGLISH_G2P;
      break;

    case 'ALGO-TRK':
      // Turkic: use English as approximation
      mapping = ENGLISH_G2P;
      break;

    case 'ALGO-FIN':
      // Uralic: use English as approximation
      mapping = ENGLISH_G2P;
      break;

    case 'ALGO-TAI':
      // Tai-Kadai: tonal, use basic mapping similar to Sinitic
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      break;

    case 'ALGO-VIET':
      // Austroasiatic (Vietnamese): tonal, use basic mapping
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      break;

    case 'ALGO-AUS':
      // Austronesian: use basic mapping
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      break;

    default:
      // Generic fallback: just use the text as-is
      return normalized;
  }

  // For tonal languages, preserve tone diacritics during processing
  const isTonal = ['ALGO-KWA', 'ALGO-CRV', 'ALGO-SIN', 'ALGO-TAI', 'ALGO-VIET', 'ALGO-BNT'].includes(family);

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
      const char = normalized[i]!;
      // For tonal languages, preserve tone diacritics (\u0300-\u0304, \u030C)
      if (isTonal && /[\u0300-\u0304\u030C]/.test(char)) {
        ipa += char;
      } else if (!/[\u0300-\u036f\s]/.test(char)) {
        // Skip non-tonal diacritics and spaces, but keep other characters
        ipa += char;
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

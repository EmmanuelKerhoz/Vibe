/**
 * Cross River Valley (CRV) family G2P
 * Languages: Hausa, Bekwarra, Calabari, Ogoja
 * CVC structure with tone and glottalization
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';

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
 * Detect long vowels in Hausa/CRV: aa, ee, ii, oo, uu
 * Returns the IPA with length marker and metadata
 */
export const detectCRVLongVowels = (text: string): { ipa: string; hasLongVowel: boolean } => {
  // Check for doubled vowels
  const longVowelPattern = /(aa|ee|ii|oo|uu)/g;
  const hasLongVowel = longVowelPattern.test(text);

  // Convert doubled vowels to IPA with length marker
  let ipa = text
    .replace(/aa/g, 'aː')
    .replace(/ee/g, 'eː')
    .replace(/ii/g, 'iː')
    .replace(/oo/g, 'oː')
    .replace(/uu/g, 'uː');

  return { ipa, hasLongVowel };
};

/**
 * Determine if a syllable should have HL contour in Hausa
 * HL contours appear on heavy syllables (CVC or CVː)
 */
export const shouldHaveHLContour = (
  onset: string,
  nucleus: string,
  coda: string,
  tone?: string
): boolean => {
  // Only apply to syllables with H tone
  if (tone !== 'H') {
    return false;
  }

  // Check if syllable is heavy (bimoraic)
  const isHeavy = coda.length > 0 || nucleus.includes('ː') || nucleus.length > 1;

  return isHeavy;
};

/**
 * CRV family G2P conversion
 */
export const crvG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping = CRV_G2P;

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
      if (/[\u0300-\u0304\u030C]/.test(char)) {
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

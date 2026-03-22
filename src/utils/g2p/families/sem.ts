/**
 * Semitic (SEM) family G2P
 * Languages: AR (Arabic), HE (Hebrew)
 * Uses combined French vowels + English consonants as approximation
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';
import { romG2P } from './rom';
import { gemG2P } from './gem';

/**
 * SEM family G2P conversion
 * Uses French vowels + English consonants as rough approximation
 */
export const semG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  // Combined mapping from French (vowels) and English (consonants)
  const FRENCH_VOWELS: Record<string, string> = {
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
  };

  const ENGLISH_CONSONANTS: Record<string, string> = {
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
    'z': 'z',

    // Common digraphs
    'th': 'θ',
    'sh': 'ʃ',
    'ch': 'tʃ',
    'ng': 'ŋ',
  };

  const mapping = { ...FRENCH_VOWELS, ...ENGLISH_CONSONANTS };

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
      if (!/[\u0300-\u036f\s]/.test(char)) {
        // Skip diacritics and spaces, but keep other characters
        ipa += char;
      }
      i++;
    }
  }

  return ipa;
};

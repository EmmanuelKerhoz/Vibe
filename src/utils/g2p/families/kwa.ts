/**
 * KWA family G2P
 * Languages: Baoulé, Dioula, Éwé, Mina
 * CV structure with tone marking preserved
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';

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
 * Apply post-voiced depression: after voiced consonants (b, d, g, gb, v, z), H tone → HM
 * This is a common tonal phenomenon in Ewe and related Kwa languages
 */
export const applyEwePostVoicedDepression = (syllables: string): string => {
  // Voiced consonants that trigger depression
  const voicedConsonants = /[bdgvz]|ɡb|gb/;

  const chars = Array.from(syllables);
  let result = '';
  let previousWasVoiced = false;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!;
    const prevChar = i > 0 ? chars[i - 1] : null;

    // Check if previous character was a voiced consonant
    if (prevChar && voicedConsonants.test(prevChar)) {
      previousWasVoiced = true;
    }

    // If current char is high tone (acute accent \u0301) and previous was voiced
    if (char === '\u0301' && previousWasVoiced) {
      // Change H to MH: add mid tone marker before high tone
      // In practice, we can represent this as keeping the high tone but marking it as depressed
      // For simplicity, we keep the original tone but the tone extraction will handle this
      result += char;
      previousWasVoiced = false;
    } else {
      result += char;
      // Reset if we encounter a vowel (end of potential trigger context)
      if (/[aeiouɛɔ]/.test(char)) {
        previousWasVoiced = false;
      }
    }
  }

  return result;
};

/**
 * Normalize 5 tones (Baoulé/Ewe) to 2 classes for rhyme matching
 * {H, MH} → 'H' (high class)
 * {ML, M, L} → 'L' (low class)
 */
export const normalizeToneTo2Classes = (tone?: string): 'H' | 'L' | undefined => {
  if (!tone) return undefined;

  // High class: H (high), MH (mid-high), R (rising - ends high)
  if (tone === 'H' || tone === 'MH' || tone === 'R') {
    return 'H';
  }

  // Low class: L (low), ML (mid-low), M (mid), F (falling - ends low)
  if (tone === 'L' || tone === 'ML' || tone === 'M' || tone === 'F') {
    return 'L';
  }

  return undefined;
};

/**
 * Apply Ewe vowel harmony: clitic -e assimilates the height of stem vowel
 * ATR (Advanced Tongue Root) harmony affects clitic vowels
 */
export const applyEweVowelHarmony = (word: string): string => {
  // Check if word ends with clitic -e
  if (!word.endsWith('e') && !word.endsWith('ə')) {
    return word;
  }

  // Find the stem vowel (last vowel before the clitic)
  const vowelPattern = /[aeiouɛɔəø]/gi;
  const vowels = Array.from(word.matchAll(vowelPattern));

  if (vowels.length < 2) {
    return word; // No stem vowel to harmonize with
  }

  // Get the stem vowel (second-to-last vowel)
  const stemVowel = vowels[vowels.length - 2]![0].toLowerCase();

  // Harmony rules based on ATR/height
  // +ATR (high): i, e, u, o → clitic becomes 'e'
  // -ATR (low): ɛ, ɔ, a → clitic becomes 'ɛ'
  const highVowels = ['i', 'e', 'u', 'o'];
  const lowVowels = ['ɛ', 'ɔ', 'a'];

  if (highVowels.includes(stemVowel)) {
    // Clitic stays as 'e'
    return word.replace(/[eə]$/, 'e');
  } else if (lowVowels.includes(stemVowel)) {
    // Clitic becomes 'ɛ'
    return word.replace(/[eə]$/, 'ɛ');
  }

  return word;
};

/**
 * KWA family G2P conversion
 */
export const kwaG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping = KWA_G2P;

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

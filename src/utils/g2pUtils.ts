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
 * G2P result with approximation metadata
 */
export interface G2PResult {
  ipa: string;
  isApproximated: boolean;
}

/**
 * Simple grapheme-to-IPA conversion with fallback
 * This is a very basic implementation for client-side fallback
 */
const graphemeToIPAFallback = (text: string, family: AlgoFamily): G2PResult => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  // Select mapping based on family
  let mapping: Record<string, string> = {};
  let isApproximated = false; // Track if this is a proxy approximation

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
      isApproximated = true;
      break;

    case 'ALGO-SEM':
      // Semitic: use French vowels + English consonants as approximation
      mapping = { ...FRENCH_G2P, ...ENGLISH_G2P };
      isApproximated = true;
      break;

    case 'ALGO-SIN':
      // Sinitic: preserve tones, use basic vowel mapping
      mapping = { 'a': 'a', 'e': 'ə', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      isApproximated = true;
      break;

    case 'ALGO-JAP':
      // Japanese: use basic CV mapping
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'ɯ', ...ENGLISH_G2P };
      isApproximated = true;
      break;

    case 'ALGO-KOR':
      // Korean: use basic mapping
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      isApproximated = true;
      break;

    case 'ALGO-BNT':
      // Bantu: similar to KWA but with different inventory
      mapping = KWA_G2P;
      isApproximated = true;
      break;

    case 'ALGO-IIR':
      // Indo-Iranian: use English as approximation
      mapping = ENGLISH_G2P;
      isApproximated = true;
      break;

    case 'ALGO-DRV':
      // Dravidian: use English as approximation
      mapping = ENGLISH_G2P;
      isApproximated = true;
      break;

    case 'ALGO-TRK':
      // Turkic: use English as approximation
      mapping = ENGLISH_G2P;
      isApproximated = true;
      break;

    case 'ALGO-FIN':
      // Uralic: use English as approximation
      mapping = ENGLISH_G2P;
      isApproximated = true;
      break;

    case 'ALGO-TAI':
      // Tai-Kadai: tonal, use basic mapping similar to Sinitic
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      isApproximated = true;
      break;

    case 'ALGO-VIET':
      // Austroasiatic (Vietnamese): tonal, use basic mapping
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      isApproximated = true;
      break;

    case 'ALGO-AUS':
      // Austronesian: use basic mapping
      mapping = { 'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u', ...ENGLISH_G2P };
      isApproximated = true;
      break;

    default:
      // Generic fallback: just use the text as-is
      return { ipa: normalized, isApproximated: true };
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

  return { ipa, isApproximated };
};

/**
 * Client-side G2P conversion with family dispatch
 * Returns G2P result with approximation flag
 */
export const graphemeToIPA = (text: string, family: AlgoFamily): G2PResult => {
  if (!text || !text.trim()) return { ipa: '', isApproximated: false };

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

/**
 * KWA (Ewe) specific rules
 */

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
 * CRV (Hausa) specific rules
 */

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
 * French specific rules
 */

/**
 * List of French suffixes with silent final -e
 */
const FRENCH_SILENT_E_SUFFIXES = ['-e', '-es', '-ent'];

/**
 * Remove silent final -e from French word nucleus
 * Handles common verb and noun endings: -e, -es, -ent
 */
export const removeFrenchSilentE = (word: string): string => {
  // Remove silent e endings
  return word
    .replace(/e$/, '')      // -e (singular)
    .replace(/es$/, '')     // -es (plural/2nd person)
    .replace(/ent$/, '');   // -ent (3rd person plural)
};

/**
 * French obligatory liaisons (most frequent 10)
 * Format: [word1_pattern, word2_pattern, liaison_consonant]
 */
export const FRENCH_OBLIGATORY_LIAISONS: Array<[RegExp, RegExp, string]> = [
  // Article + noun/adjective
  [/^les$/i, /^[aeiouéèêh]/i, 'z'],        // les_enfants → [lezɑ̃fɑ̃]
  [/^des$/i, /^[aeiouéèêh]/i, 'z'],        // des_amis → [dezami]
  [/^ces$/i, /^[aeiouéèêh]/i, 'z'],        // ces_arbres → [sezaʁbʁ]
  [/^mes$/i, /^[aeiouéèêh]/i, 'z'],        // mes_amis → [mezami]
  [/^tes$/i, /^[aeiouéèêh]/i, 'z'],        // tes_enfants → [tezɑ̃fɑ̃]
  [/^ses$/i, /^[aeiouéèêh]/i, 'z'],        // ses_amis → [sezami]

  // Pronoun + verb
  [/^nous$/i, /^[aeiouéèêh]/i, 'z'],       // nous_avons → [nuzavɔ̃]
  [/^vous$/i, /^[aeiouéèêh]/i, 'z'],       // vous_êtes → [vuzɛt]
  [/^ils$/i, /^[aeiouéèêh]/i, 'z'],        // ils_ont → [ilzɔ̃]
  [/^elles$/i, /^[aeiouéèêh]/i, 'z'],      // elles_ont → [ɛlzɔ̃]

  // Preposition + article/noun
  [/^en$/i, /^[aeiouéèêh]/i, 'n'],         // en_été → [ɑ̃nete]
  [/^un$/i, /^[aeiouéèêh]/i, 'n'],         // un_ami → [œ̃nami]
];

/**
 * Apply French liaison rules between two words
 */
export const applyFrenchLiaison = (word1: string, word2: string): string | null => {
  for (const [pattern1, pattern2, consonant] of FRENCH_OBLIGATORY_LIAISONS) {
    if (pattern1.test(word1) && pattern2.test(word2)) {
      return consonant;
    }
  }
  return null;
};

/**
 * English specific rules
 */

/**
 * Common English homophones and irregular pronunciations for lyrics
 * Format: [graphemic, IPA_pronunciation, context_notes]
 * Prioritized lookup table before generic rules
 */
export const ENGLISH_LYRICAL_HOMOPHONES: Record<string, string> = {
  // Common rhyme pairs
  'love': 'lʌv',
  'dove': 'dʌv',      // (bird) - rhymes with love
  'of': 'ʌv',         // weak form rhymes with love/dove

  'time': 'taɪm',
  'rhyme': 'ɹaɪm',
  'climb': 'klaɪm',
  'crime': 'kɹaɪm',

  // Irregular vowels
  'heart': 'hɑɹt',
  'break': 'bɹeɪk',
  'great': 'gɹeɪt',
  'steak': 'steɪk',

  // Silent letters
  'know': 'noʊ',
  'knee': 'ni',
  'knife': 'naɪf',
  'knight': 'naɪt',
  'write': 'ɹaɪt',
  'wrong': 'ɹɔŋ',
  'wrap': 'ɹæp',

  // Common words with unexpected pronunciation
  'said': 'sɛd',
  'says': 'sɛz',
  'again': 'əgɛn',
  'against': 'əgɛnst',

  'been': 'bɪn',
  'seen': 'sin',
  'dream': 'dɹim',
  'scream': 'skɹim',

  'eye': 'aɪ',
  'buy': 'baɪ',
  'by': 'baɪ',
  'bye': 'baɪ',
  'high': 'haɪ',
  'sky': 'skaɪ',
  'fly': 'flaɪ',
  'try': 'tɹaɪ',
  'cry': 'kɹaɪ',
  'dry': 'dɹaɪ',
  'why': 'waɪ',

  'through': 'θɹu',
  'threw': 'θɹu',
  'true': 'tɹu',
  'blue': 'blu',
  'you': 'ju',
  'to': 'tu',
  'too': 'tu',
  'two': 'tu',

  'night': 'naɪt',
  'light': 'laɪt',
  'right': 'ɹaɪt',
  'sight': 'saɪt',
  'fight': 'faɪt',
  'might': 'maɪt',
  'bright': 'bɹaɪt',
  'flight': 'flaɪt',

  'all': 'ɔl',
  'call': 'kɔl',
  'fall': 'fɔl',
  'hall': 'hɔl',
  'ball': 'bɔl',
  'wall': 'wɔl',
  'tall': 'tɔl',
  'small': 'smɔl',

  'day': 'deɪ',
  'way': 'weɪ',
  'say': 'seɪ',
  'may': 'meɪ',
  'play': 'pleɪ',
  'stay': 'steɪ',
  'away': 'əweɪ',
  'today': 'tədeɪ',

  'go': 'goʊ',
  'no': 'noʊ',
  'so': 'soʊ',
  'show': 'ʃoʊ',
  'though': 'ðoʊ',
  'soul': 'soʊl',
  'goal': 'goʊl',

  'make': 'meɪk',
  'take': 'teɪk',
  'wake': 'weɪk',
  'shake': 'ʃeɪk',

  'feel': 'fil',
  'real': 'ɹil',
  'deal': 'dil',
  'steal': 'stil',
  'heal': 'hil',

  'around': 'əɹaʊnd',
  'sound': 'saʊnd',
  'found': 'faʊnd',
  'ground': 'gɹaʊnd',
  'down': 'daʊn',
  'town': 'taʊn',
  'crown': 'kɹaʊn',
  'brown': 'bɹaʊn',

  'mind': 'maɪnd',
  'find': 'faɪnd',
  'kind': 'kaɪnd',
  'blind': 'blaɪnd',
  'behind': 'bɪhaɪnd',

  'come': 'kʌm',
  'some': 'sʌm',
  'done': 'dʌn',
  'one': 'wʌn',
  'none': 'nʌn',
  'son': 'sʌn',
  'won': 'wʌn',

  'are': 'ɑɹ',
  'far': 'fɑɹ',
  'car': 'kɑɹ',
  'star': 'stɑɹ',
  'hard': 'hɑɹd',

  'fire': 'faɪəɹ',
  'desire': 'dɪzaɪəɹ',
  'higher': 'haɪəɹ',
  'wire': 'waɪəɹ',
};

/**
 * Lookup English word in homophone table before applying generic rules
 */
export const lookupEnglishHomophone = (word: string): string | null => {
  const normalized = word.toLowerCase().trim();
  return ENGLISH_LYRICAL_HOMOPHONES[normalized] || null;
};

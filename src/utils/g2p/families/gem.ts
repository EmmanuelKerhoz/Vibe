/**
 * Germanic (GEM) family G2P
 * Languages: EN (English), DE (German), NL (Dutch)
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';

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

/**
 * GEM family G2P conversion
 * Uses English as proxy for all Germanic languages
 */
export const gemG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');

  // First check if it's a common word in the homophone table
  const homophone = lookupEnglishHomophone(normalized);
  if (homophone) {
    return homophone;
  }

  let ipa = '';
  let i = 0;

  const mapping = ENGLISH_G2P;

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

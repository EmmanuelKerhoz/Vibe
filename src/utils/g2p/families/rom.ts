/**
 * Romance (ROM) family G2P
 * Languages: FR (French), ES (Spanish), PT (Portuguese), IT (Italian)
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';

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
 * ROM family G2P conversion
 * Uses French as proxy for all Romance languages
 */
export const romG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping = FRENCH_G2P;

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

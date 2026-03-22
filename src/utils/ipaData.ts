/**
 * IPA phoneme feature data
 */

/**
 * Phoneme features based on PHOIBLE classification
 */
export interface PhonemeFeatures {
  /** Place of articulation: bilabial, alveolar, velar, etc. */
  place: string;
  /** Manner of articulation: stop, fricative, nasal, vowel, etc. */
  manner: string;
  /** Voicing: voiced, voiceless */
  voicing: string;
  /** Nasality: nasal, oral */
  nasality: string;
  /** Tone (for tonal languages): H, L, M, R, F, etc. */
  tone?: string;
  /** Vowel height: high, mid, low (for vowels) */
  height?: string;
  /** Vowel backness: front, central, back (for vowels) */
  backness?: string;
  /** Roundedness: rounded, unrounded (for vowels) */
  rounded?: string;
}

/**
 * Simplified phoneme feature database
 * Maps IPA symbols to articulatory features
 */
export const PHONEME_FEATURES: Record<string, PhonemeFeatures> = {
  // Vowels
  'i': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'front', rounded: 'unrounded' },
  'e': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'front', rounded: 'unrounded' },
  'ɛ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'front', rounded: 'unrounded' },
  'a': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'low', backness: 'central', rounded: 'unrounded' },
  'ɑ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'low', backness: 'back', rounded: 'unrounded' },
  'ɔ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'back', rounded: 'rounded' },
  'o': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'back', rounded: 'rounded' },
  'u': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'back', rounded: 'rounded' },
  'y': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'front', rounded: 'rounded' },
  'ø': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'front', rounded: 'rounded' },
  'œ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'front', rounded: 'rounded' },
  'ə': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'mid', backness: 'central', rounded: 'unrounded' },
  'ɨ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'central', rounded: 'unrounded' },
  'ʊ': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'oral', height: 'high', backness: 'back', rounded: 'rounded' },

  // Nasal vowels (French)
  'ɛ̃': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'nasal', height: 'mid', backness: 'front', rounded: 'unrounded' },
  'ɑ̃': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'nasal', height: 'low', backness: 'back', rounded: 'unrounded' },
  'ɔ̃': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'nasal', height: 'mid', backness: 'back', rounded: 'rounded' },
  'œ̃': { place: 'vowel', manner: 'vowel', voicing: 'voiced', nasality: 'nasal', height: 'mid', backness: 'front', rounded: 'rounded' },

  // Stops
  'p': { place: 'bilabial', manner: 'stop', voicing: 'voiceless', nasality: 'oral' },
  'b': { place: 'bilabial', manner: 'stop', voicing: 'voiced', nasality: 'oral' },
  't': { place: 'alveolar', manner: 'stop', voicing: 'voiceless', nasality: 'oral' },
  'd': { place: 'alveolar', manner: 'stop', voicing: 'voiced', nasality: 'oral' },
  'k': { place: 'velar', manner: 'stop', voicing: 'voiceless', nasality: 'oral' },
  'g': { place: 'velar', manner: 'stop', voicing: 'voiced', nasality: 'oral' },
  'ʔ': { place: 'glottal', manner: 'stop', voicing: 'voiceless', nasality: 'oral' },

  // Fricatives
  'f': { place: 'labiodental', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'v': { place: 'labiodental', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  's': { place: 'alveolar', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'z': { place: 'alveolar', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  'ʃ': { place: 'postalveolar', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'ʒ': { place: 'postalveolar', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  'h': { place: 'glottal', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'x': { place: 'velar', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'ɣ': { place: 'velar', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  'θ': { place: 'dental', manner: 'fricative', voicing: 'voiceless', nasality: 'oral' },
  'ð': { place: 'dental', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },

  // Nasals
  'm': { place: 'bilabial', manner: 'nasal', voicing: 'voiced', nasality: 'nasal' },
  'n': { place: 'alveolar', manner: 'nasal', voicing: 'voiced', nasality: 'nasal' },
  'ɲ': { place: 'palatal', manner: 'nasal', voicing: 'voiced', nasality: 'nasal' },
  'ŋ': { place: 'velar', manner: 'nasal', voicing: 'voiced', nasality: 'nasal' },

  // Liquids
  'l': { place: 'alveolar', manner: 'lateral', voicing: 'voiced', nasality: 'oral' },
  'ʎ': { place: 'palatal', manner: 'lateral', voicing: 'voiced', nasality: 'oral' },
  'r': { place: 'alveolar', manner: 'trill', voicing: 'voiced', nasality: 'oral' },
  'ʁ': { place: 'uvular', manner: 'fricative', voicing: 'voiced', nasality: 'oral' },
  'ɹ': { place: 'alveolar', manner: 'approximant', voicing: 'voiced', nasality: 'oral' },

  // Approximants
  'j': { place: 'palatal', manner: 'approximant', voicing: 'voiced', nasality: 'oral' },
  'w': { place: 'labio-velar', manner: 'approximant', voicing: 'voiced', nasality: 'oral' },
  'ɥ': { place: 'labio-palatal', manner: 'approximant', voicing: 'voiced', nasality: 'oral' },
};

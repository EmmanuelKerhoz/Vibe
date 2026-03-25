/**
 * Client-side G2P (Grapheme-to-Phoneme) utilities
 * Implements Step 2 of the IPA pipeline: grapheme → IPA conversion
 *
 * This provides client-side fallback when the phonemization microservice is unavailable.
 * Uses simplified graphemic approximations of IPA.
 *
 * Based on docs_fusion_optimal.md specification
 *
 * NOTE: This file is now a backward-compatibility re-export wrapper.
 * The actual implementation has been modularized into src/utils/g2p/
 */

// Re-export everything from the dispatcher
export {
  graphemeToIPA,
  looksLikeIPA,
  normalizeForG2P,
  splitIntoWords,
  wordsToIPA,
  textToIPAWithBoundaries,
  // French (ROM) specific
  removeFrenchSilentE,
  applyFrenchLiaison,
  FRENCH_OBLIGATORY_LIAISONS,
  // English (GEM) specific
  lookupEnglishHomophone,
  ENGLISH_LYRICAL_HOMOPHONES,
  isOpenSyllableExpected,
  // Ewe/KWA specific
  applyEwePostVoicedDepression,
  normalizeToneTo2Classes,
  applyEweVowelHarmony,
  // Hausa/CRV specific
  detectCRVLongVowels,
  shouldHaveHLContour,
} from './g2p/dispatcher';

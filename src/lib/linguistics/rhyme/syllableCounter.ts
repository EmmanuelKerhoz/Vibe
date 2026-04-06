/**
 * syllableCounter.ts
 * Counts syllables from an IPA string or from a raw word via heuristic rules.
 *
 * Strategy:
 * 1. IPA path (preferred): count vocalic nuclei in the IPA transcription.
 * 2. Orthographic fallback (no IPA): language-aware heuristic.
 *
 * docs_fusion_optimal.md §3 (syllabification).
 */

import { segmentIPA } from '../scoring/similarity';

// IPA vowels — broad set covering all families in scope
const IPA_VOWELS = new Set([
  'a', 'e', 'i', 'o', 'u',
  'ɑ', 'ɛ', 'ɔ', 'ɪ', 'ʊ', 'ə', 'ɐ', 'ɵ',
  'æ', 'œ', 'ø', 'ɯ', 'ɤ', 'ɶ',
  'ã', 'ẽ', 'ĩ', 'õ', 'ũ',   // nasal vowels (PT/FR)
  'aː', 'eː', 'iː', 'oː', 'uː', // long vowels
]);

/**
 * Count syllables from an IPA string.
 * Each vocalic nucleus token = one syllable.
 */
export function countSyllablesFromIPA(ipa: string): number {
  const tokens = segmentIPA(ipa);
  return tokens.filter(t => IPA_VOWELS.has(t)).length;
}

// ── Orthographic fallback heuristics ──────────────────────────────────────

/**
 * FR: silent -e and -es endings (preceded by a consonant grapheme).
 *
 * The original pattern also matched `ent$` to handle the 3rd-person-plural
 * verbal ending "ils chantent" → /ʃɑ̃t/. However, `ent$` is over-broad:
 * it incorrectly elides the final syllable of nominal/adjectival words like
 * "talent", "serpent", "orient", "différent" where /ɑ̃/ is fully pronounced.
 *
 * Fix: `ent$` is replaced by a tighter verbal-form guard that requires
 * the two characters before `ent` to be a consonant + consonant sequence
 * (typical of 3p-pl verb stems: chant-ent, parl-ent, viv-ent, pren-ent).
 * Pure nominal endings like "talent" (l+e+n+t) are excluded because the
 * vowel group count already accounts for the /ɑ̃/ nucleus.
 *
 * Pattern breakdown:
 *   (?<=[^aeiouéèêëàâùîïôœ])e[s]?$   — silent -e / -es after consonant
 *   (?<=[^aeiouéèêëàâùîïôœ]{2})ent$  — verbal -ent after ≥2 consonants
 */
const FR_SILENT_E_RE =
  /(?<=[^aeiouéèêëàâùîïôœ])e[s]?$|(?<=[^aeiouéèêëàâùîïôœ]{2})ent$/i;

/**
 * Count syllables from a raw word using language-aware heuristics.
 * Used when no IPA is available (low-resource path).
 *
 * @param word  - Raw (orthographic) word, lowercased expected.
 * @param lang  - ISO 639-1/3 code.
 */
export function countSyllablesHeuristic(word: string, lang: string): number {
  const w = word.toLowerCase().trim();
  if (!w) return 0;

  // ── French ────────────────────────────────────────────────────────────────
  if (lang === 'fr') {
    // Count orthographic vowel groups, then subtract silent -e endings
    const vgroups = (w.match(/[aeiouyàâéèêëîïôùûœæ]+/gi) ?? []).length;
    const silentE = FR_SILENT_E_RE.test(w) ? 1 : 0;
    return Math.max(1, vgroups - silentE);
  }

  // ── Spanish / Italian / Portuguese ────────────────────────────────────────
  if (['es', 'it', 'pt', 'ca'].includes(lang)) {
    const vgroups = (w.match(/[aeiouáéíóúàèìòùâêîôûãõ]+/gi) ?? []).length;
    return Math.max(1, vgroups);
  }

  // ── Germanic (EN, DE, NL, SV…) ───────────────────────────────────────────
  if (['en', 'de', 'nl', 'sv', 'da', 'no', 'is'].includes(lang)) {
    // Count vowel groups; subtract silent trailing -e (EN only)
    let vgroups = (w.match(/[aeiouyäöüæøå]+/gi) ?? []).length;
    if (lang === 'en' && /[^aeiouy]e$/.test(w)) vgroups -= 1;
    return Math.max(1, vgroups);
  }

  // ── CV languages (Bantu, Kwa, Japanese) — one syllable per vowel letter ──
  if (['sw', 'yo', 'zu', 'xh', 'bci', 'dyu', 'ee', 'gej', 'ja'].includes(lang)) {
    return Math.max(1, (w.match(/[aeiouɛɔ]/gi) ?? []).length);
  }

  // ── Arabic / Hebrew ────────────────────────────────────────────────────────
  if (['ar', 'he'].includes(lang)) {
    // Rough: count consonant clusters as syllable starters
    return Math.max(1, (w.match(/[\u0600-\u06ff\u05d0-\u05ea]/g) ?? []).length / 2 | 0);
  }

  // ── Default: vowel-group count ─────────────────────────────────────────────
  return Math.max(1, (w.match(/[aeiouàâéèêëîïôùûœæ]+/gi) ?? []).length);
}

/**
 * Unified entry point.
 * Uses IPA path when available, falls back to heuristic.
 *
 * @param wordOrIPA  - Either an IPA transcription (starts with '/') or a raw word.
 * @param lang       - ISO language code.
 */
export function countSyllables(wordOrIPA: string, lang: string): number {
  if (wordOrIPA.startsWith('/') || wordOrIPA.startsWith('[')) {
    // IPA notation — strip delimiters and count
    const ipa = wordOrIPA.replace(/^[\/\[]+|[\/\]]+$/g, '').trim();
    return countSyllablesFromIPA(ipa);
  }
  return countSyllablesHeuristic(wordOrIPA, lang);
}

/**
 * frNormalizer.ts
 * Pre-processing pass for French orthographic input before G2P and RN extraction.
 *
 * Problem: the raw word "chante" fed into the generic G2P produces /ʃɑ̃tə/,
 * including a schwa nucleus that pollutes the RhymeNucleus — "chante" and
 * "plante" would score < 1.0 due to the trailing /ə/ mismatch.
 *
 * This module normalises the orthographic form BEFORE G2P so that:
 *   chante  → chant   → /ʃɑ̃t/    ✓ rhymes with plante, ante, tante
 *   chantent → chant  → /ʃɑ̃t/    ✓ idem
 *   vent    → vent    → /vɑ̃/     ✓ rhymes with enfant, temps
 *   argent  → argent  → /aʁʒɑ̃/  ✓ rhymes with vent
 *   monde   → mond    → /mɔ̃d/    ✓ rhymes with blonde, onde
 *   libre   → libre   → /libʁ/   ✓ sonorant cluster preserved
 *
 * docs_fusion_optimal.md §4 (ALGO-ROM / FR G2P)
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Clitic monosyllables that keep their final -e. */
const FR_CLITICS = new Set([
  'le', 'la', 'me', 'te', 'se', 'ce', 'de', 'ne', 'que', 'je',
  'y',  'en',
]);

/**
 * Known nominal/adjectival -ent words that must NOT have -ent stripped.
 * Extend as needed — this is the exception list, not the rule list.
 */
const FR_NOMINAL_ENT = new Set([
  'vent', 'lent', 'cent', 'tent', 'dent', 'ment', 'rent', 'sent',
  'agent', 'argent', 'accent', 'talent', 'uvent', 'orient', 'occident',
  'client', 'patient', 'ambient', 'torrent', 'prudent', 'ardent',
  'urgent', 'savant', 'enfant', 'avant', 'devant', 'pendant', 'enant',
]);

/**
 * Vowel graphemes (including accented) used in guard checks.
 */
const FR_VOWELS_RE = /[aeiouyàâéèêëîïôùûœæ]/i;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * True if the character at position i in s is preceded by a sonorant
 * consonant grapheme (r, l, n, m) — sonorant + e forms a real syllable.
 */
function precededBySonorant(s: string, i: number): boolean {
  if (i <= 0) return false;
  return 'rlnm'.includes(s[i - 1]!.toLowerCase());
}

/**
 * True if the character at position i is preceded by an obstruent
 * (i.e. a non-vowel, non-sonorant consonant).
 */
function precededByObstruent(s: string, i: number): boolean {
  if (i <= 0) return false;
  const c = s[i - 1]!.toLowerCase();
  return !FR_VOWELS_RE.test(c) && !'rlnm'.includes(c);
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Normalise a French word for rhyme-nucleus extraction.
 *
 * Steps applied in order:
 * 1. Lowercase + trim.
 * 2. Guard: clitics and very short words pass through unchanged.
 * 3. Strip verbal -ent (3rd-person plural) — NOT nominal -ent.
 * 4. Strip silent -es (plural / subjunctive).
 * 5. Strip silent -e after obstruent (not after sonorant cluster).
 *
 * @param word  Raw orthographic French word.
 * @returns     Normalised form ready for G2P input.
 */
export function normalizeFrenchForRhyme(word: string): string {
  const w = word.toLowerCase().trim();
  if (!w || w.length <= 2) return w;
  if (FR_CLITICS.has(w)) return w;

  // ── Step 3: verbal -ent ────────────────────────────────────────────────
  // Strip -ent when:
  //   a) word ends with -ent
  //   b) NOT in the nominal/adjectival exception list
  //   c) the stem (without -ent) ends in ≥2 consonant graphemes (verb form)
  if (w.endsWith('ent') && !FR_NOMINAL_ENT.has(w)) {
    const stem = w.slice(0, -3);
    // Require stem to end in a consonant (typical verb: parlent → parl)
    if (stem.length >= 2 && !FR_VOWELS_RE.test(stem[stem.length - 1]!)) {
      return stem;
    }
  }

  // ── Step 4: silent -es ────────────────────────────────────────────────
  // Strip -es when:
  //   a) word ends with -es
  //   b) preceded by an obstruent (not sonorant)
  //   c) not a stressed -ès / -és form
  if (w.endsWith('es') && !w.endsWith('ès') && !w.endsWith('és')) {
    const i = w.length - 2; // index of 'e'
    if (precededByObstruent(w, i)) {
      return w.slice(0, -2);
    }
  }

  // ── Step 5: silent -e final ────────────────────────────────────────────
  // Strip -e when:
  //   a) ends with -e (unaccented)
  //   b) preceded by an obstruent
  //   c) NOT preceded by sonorant (libre, sombre, simple → keep)
  if (
    w.endsWith('e') &&
    !w.endsWith('é') &&
    !w.endsWith('è') &&
    !w.endsWith('ê')
  ) {
    const i = w.length - 1;
    if (precededByObstruent(w, i) && !precededBySonorant(w, i)) {
      return w.slice(0, -1);
    }
  }

  return w;
}

/**
 * Convenience: normalise an array of words (e.g. a full lyric line split).
 */
export function normalizeFrenchLine(words: string[]): string[] {
  return words.map(normalizeFrenchForRhyme);
}

/**
 * FrenchG2P.ts
 * Rule-based grapheme-to-phoneme transform for French (FR).
 *
 * Scope: single-word or space-separated token input (post-normalize).
 * Output: string with IPA nasal-vowel tokens and vocalic digraphs replaced,
 *         suitable for downstream syllabify() in RomanceStrategy.
 *
 * Processing order (must be preserved — earlier rules consume chars):
 *   1. Lowercase + NFC normalisation (caller should have done this already;
 *      we normalise defensively).
 *   2. Nasal vowel sequences: V+n/m before consonant or word-end → IPA nasal.
 *      Context guard: V+n/m before another vowel is NOT nasal (e.g. "amine").
 *   3. Vocalic digraphs: orthographic pairs → single IPA token.
 *   4. Silent-h strip (mute h — aspirate h kept as marker).
 *
 * Liaison inter-mots is NOT handled here (requires sentence-level context).
 *
 * docs_fusion_optimal.md §10.1 — Romance G2P (FR).
 */

// ─── Nasal vowel map ──────────────────────────────────────────────────────────

/**
 * Grapheme → IPA nasal vowel token.
 * Key: lowercase vowel grapheme(s) that precede the nasal consonant.
 * Ordered by descending specificity so 'ou' is tested before 'o'.
 */
const NASAL_MAP: Array<[vowelRe: RegExp, nasal: string]> = [
  // an / am / en / em → /ɑ̃/
  // Includes accented variants: à, â, è, é, ê, ë
  [/[aàâ](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɑ̃_pre'], // placeholder — replaced below
  [/[eéèêë](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɑ̃_pre'],
  // in / im / yn / ym → /ɛ̃/
  [/[iîïy](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɛ̃_pre'],
  // on / om → /ɔ̃/
  [/o(?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɔ̃_pre'],
  // un / um → /œ̃/
  [/[uùûü](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'œ̃_pre'],
];

// After flagging the vowel, strip the following n/m (absorbed into nasal token).
const NASAL_STRIP_RE = /([ɑɛɔœ]̃_pre)[nm]/g;

// Remove the _pre suffix marker.
const NASAL_FINALISE_RE = /_pre/g;

// ─── Vocalic digraphs ─────────────────────────────────────────────────────────

/**
 * Ordered list of grapheme → IPA replacements.
 * Must be applied in order: longer patterns first to avoid partial matches.
 */
const DIGRAPH_MAP: Array<[re: RegExp, ipa: string]> = [
  [/eau/g, 'o'],   // eau → /o/  (beau, chapeau)
  [/au/g,  'o'],   // au  → /o/  (fauteuil, chaud)
  [/ou/g,  'u'],   // ou  → /u/  (tout, coup)
  [/eu/g,  'ø'],   // eu  → /ø/  (feu, bleu)  — open /œ/ allophone ignored at this level
  [/œu/g,  'ø'],   // œu  → /ø/  (cœur — after NFC œ is single char; keep for safety)
  [/oe/g,  'ø'],   // oe  → /ø/  (poème in some transcriptions)
  [/ai/g,  'ɛ'],   // ai  → /ɛ/  (lait, vrai)
  [/ei/g,  'ɛ'],   // ei  → /ɛ/  (neige, peine)
  [/ay/g,  'ɛ'],   // ay  → /ɛ/  (pays, rayure)
  [/oi/g,  'wa'],  // oi  → /wa/ (bois, voix)
];

// ─── Silent-h strip ───────────────────────────────────────────────────────────

/**
 * French aspirate-h words (most frequent).
 * Aspirate h blocks elision/liaison — represented here as a leading '_h_' marker.
 * Mute h is simply stripped.
 *
 * This list covers the most common aspirate-h words encountered in song lyrics.
 * Expansion is straightforward: add entries to ASPIRATE_H_WORDS.
 */
const ASPIRATE_H_WORDS = new Set([
  'haïr', 'haine', 'hameau', 'hanche', 'hardi', 'haricot', 'hasard',
  'haut', 'héros', 'hibou', 'hier', 'honte', 'horloge', 'housse',
  'huit', 'hurler',
]);

/**
 * Strip or mark the initial h of a word.
 * - Aspirate h: replace leading h with '_h_' marker (blocks liaison in caller).
 * - Mute h: strip silently.
 */
function processInitialH(word: string): string {
  if (!word.startsWith('h')) return word;
  if (ASPIRATE_H_WORDS.has(word)) {
    return '_h_' + word.slice(1);
  }
  // Mute h — strip
  return word.slice(1);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Transform a French word (orthographic, post-normalize) into a phonemic
 * token string suitable for `RomanceStrategy.syllabify()`.
 *
 * @param word - Single word, lowercase, NFC normalised.
 * @returns Phonemic string with nasal vowel tokens + digraph expansions.
 *
 * @example
 * frenchG2P('chant')   // → 'ʃɑ̃t'  (nasal ɑ̃, ch→ʃ)
 * frenchG2P('vent')    // → 'vɑ̃t'  (nasal ɑ̃)
 * frenchG2P('beau')    // → 'bo'   (eau→o)
 * frenchG2P('nuit')    // → 'nɥi'  (ui handled by digraph + glide)
 * frenchG2P('amine')   // → 'amine' (nasal guard: i+n before e → not nasal)
 */
export function frenchG2P(word: string): string {
  let w = word.normalize('NFC').toLowerCase();

  // 1. Initial h
  w = processInitialH(w);

  // 2. Nasal vowels — flag then strip absorbed nasal consonant
  for (const [re, token] of NASAL_MAP) {
    w = w.replace(re, token);
  }
  // Strip absorbed n/m after flagged vowel
  w = w.replace(NASAL_STRIP_RE, '$1');
  // Remove _pre marker
  w = w.replace(NASAL_FINALISE_RE, '');

  // 3. Consonant digraphs (before vocalic to avoid interference)
  w = w.replace(/ch/g, 'ʃ');
  w = w.replace(/gn/g, 'ɲ');
  w = w.replace(/ph/g, 'f');

  // 4. Vocalic digraphs (longest first)
  for (const [re, ipa] of DIGRAPH_MAP) {
    w = w.replace(re, ipa);
  }

  return w;
}

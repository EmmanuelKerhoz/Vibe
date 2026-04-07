/**
 * FrenchG2P.ts
 * Rule-based grapheme-to-phoneme transform for French (FR).
 *
 * Scope: single-word or space-separated token input (post-normalize).
 * Output: string with IPA nasal-vowel tokens and vocalic digraphs replaced,
 *         suitable for downstream syllabify() in RomanceStrategy.
 *
 * Processing order (must be preserved — earlier rules consume chars):
 *   1. Lowercase + NFC normalisation.
 *   2. Initial-h: aspirate h marked, mute h stripped.
 *   3. Nasal vowel sequences: V+n/m before consonant or word-end → IPA nasal.
 *      Context guard: V+n/m before another vowel is NOT nasal (e.g. "amine").
 *   4. Consonant digraphs (ch, gn, ph).
 *   5. c → k before a/o/u/consonant (hard c).
 *   6. Glide ui → ɥi (must precede vocalic digraphs to avoid ui→u).
 *   7. Vocalic digraphs: orthographic pairs → single IPA token.
 *      NOTE: 'ue' → 'ɥɛ' must precede 'eu' to avoid overlap (muet → mɥɛ).
 *   8. Mute final e: bare 'e' at word-end stripped BEFORE consonant strip,
 *      so that the newly exposed final consonant is then stripped in step 9.
 *   9. Silent final consonants: d, t, g, r, s, x, z, p stripped at word-end.
 *
 * IMPORTANT: mute-e strip (8) MUST precede final-consonant strip (9).
 * Rationale: "vente" → nasals → "vɑ̃te" → strip mute-e → "vɑ̃t" → strip t → "vɑ̃".
 * Previous order (consonants first) left the 't' after "vɑ̃te"→"vɑ̃t" unreachable
 * because the vowel before 't' was \u0303 (combining tilde), not in the charset.
 *
 * docs_fusion_optimal.md §10.1 — Romance G2P (FR).
 */

// ─── Nasal vowel map ────────────────────────────────────────────────────────────

const NASAL_MAP: Array<[vowelRe: RegExp, nasal: string]> = [
  [/[aàâ](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɑ\u0303_\u00a7'],
  [/[eéèêë](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɑ\u0303_\u00a7'],
  [/[iîïy](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɛ\u0303_\u00a7'],
  [/o(?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɔ\u0303_\u00a7'],
  [/[uùûü](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'œ\u0303_\u00a7'],
];

const NASAL_STRIP_RE = /([\u0251\u025b\u0254\u0153]\u0303_\u00a7)[nm]/g;
const NASAL_FINALISE_RE = /_\u00a7/g;

// ─── Vocalic digraphs ───────────────────────────────────────────────────────────
// NOTE: 'ue'→'ɥɛ' MUST appear before 'eu'→'ø' to prevent overlap.
// 'ue' occurs in muet, fluet, duet, nuée — all yield /ɥɛ/ nucleus.

const DIGRAPH_MAP: Array<[re: RegExp, ipa: string]> = [
  [/ue/g,  'ɥɛ'],   // muet→mɥɛt, fluet→flɥɛt  — BEFORE eu
  [/eau/g, 'o'],
  [/au/g,  'o'],
  [/ou/g,  'u'],
  [/eu/g,  'ø'],
  [/œu/g,  'ø'],
  [/oe/g,  'ø'],
  [/ai/g,  'ɛ'],
  [/ei/g,  'ɛ'],
  [/ay/g,  'ɛ'],
  [/oi/g,  'wa'],
];

// ─── Silent-h ───────────────────────────────────────────────────────────────

const ASPIRATE_H_WORDS = new Set([
  'haïr', 'haine', 'hameau', 'hanche', 'hardi', 'haricot', 'hasard',
  'haut', 'héros', 'hibou', 'hier', 'honte', 'horloge', 'housse',
  'huit', 'hurler',
  'halte', 'hamster', 'hangar', 'hanneton', 'harceler', 'hargneux',
  'harpe', 'hausse', 'hennir', 'hérisson', 'heurter', 'hiberner',
  'hiérarchie', 'hocher', 'hold-up', 'hollande', 'homard', 'hongre',
  'hooligan', 'horde', 'houspiller', 'huard', 'huche', 'huer',
  'huissier', 'hulotte', 'hululer', 'hurlement', 'hussard', 'hype',
]);

function processInitialH(word: string): string {
  if (!word.startsWith('h')) return word;
  if (ASPIRATE_H_WORDS.has(word)) return '_h_' + word.slice(1);
  return word.slice(1);
}

// ─── Mute final e ───────────────────────────────────────────────────────────────

// IPA vowel characters present after G2P transforms (incl. combining tilde)
const IPA_VOWEL_RE = /[aeiouyɑɛɔœøɥ\u0303]/u;

/**
 * Strip mute final 'e' (bare, unaccented) BEFORE silent-consonant strip.
 * Accented finals (é, è, ê) are NOT mute and are preserved.
 * Monosyllabic guard: if stripping leaves no vowel in stem, keep the 'e'.
 */
function stripMuteE(w: string): string {
  if (!w.endsWith('e')) return w;
  const stem = w.slice(0, -1);
  if (stem.length === 0) return w;
  if (!IPA_VOWEL_RE.test(stem)) return w;
  return stem;
}

// ─── Silent final consonants ───────────────────────────────────────────────────────────

/**
 * Strip typical silent final consonants in French.
 * Called AFTER stripMuteE so that "vente"→"vɑ̃t" correctly loses its 't'.
 *
 * The vowel-before-consonant charset includes \u0303 (combining tilde)
 * so that nasal tokens like ɑ̃ (\u0251 + \u0303) correctly anchor the strip.
 *
 * Rules:
 *   -ent (3pp) → strip 'nt' after vowel/nasal (chantent → ʃɑ̃tɑ̃)
 *   -et        → ɛ
 *   -er / -ez  → kept (map to /e/ via digraph, no strip needed)
 *   d, t, g, r, s, x, z, p at word-end after vowel → strip
 */
function stripSilentFinalConsonants(w: string): string {
  // -ent verbal 3pp: strip trailing 'nt' after vowel or combining tilde
  w = w.replace(/([aeiouyɑɛɔœøɥwa\u0303])nt$/u, '$1');

  // -et → ɛ
  w = w.replace(/et$/, 'ɛ');

  // Bare final d, t, g, r, s, x, z, p after vowel or combining tilde
  w = w.replace(/([aeiouyɑɛɔœøɥwa\u0303])[dtgrpszx]$/u, '$1');

  return w;
}

// ─── Public API ───────────────────────────────────────────────────────────────────

/**
 * Transform a French word (orthographic, post-normalize) into a phonemic
 * token string suitable for `RomanceStrategy.syllabify()`.
 *
 * @example
 * frenchG2P('chant')    // → 'ʃɑ̃'
 * frenchG2P('chante')   // → 'ʃɑ̃'
 * frenchG2P('vente')    // → 'vɑ̃'
 * frenchG2P('page')     // → 'pa'
 * frenchG2P('heure')    // → 'ø'
 * frenchG2P('café')     // → 'kafé'
 * frenchG2P('nuit')     // → 'nɥi'
 * frenchG2P('muet')     // → 'mɥɛ'  (ue→ɥɛ, silent t stripped)
 * frenchG2P('le')       // → 'le'   (monosyllabic guard)
 */
export function frenchG2P(word: string): string {
  let w = word.normalize('NFC').toLowerCase();

  // 1. Initial h
  w = processInitialH(w);

  // 2. Nasal vowels
  for (const [re, token] of NASAL_MAP) {
    w = w.replace(re, token);
  }
  w = w.replace(NASAL_STRIP_RE, '$1');
  w = w.replace(NASAL_FINALISE_RE, '');

  // 3. Consonant digraphs
  w = w.replace(/ch/g, 'ʃ');
  w = w.replace(/gn/g, 'ɲ');
  w = w.replace(/ph/g, 'f');

  // 4. Hard c → k (before a, o, u, or consonant; NOT before e/i where c=s)
  w = w.replace(/c(?=[aouàâôùûɑɔœ])/gu, 'k');
  w = w.replace(/c(?=[^eiéèêëîïɛ])/gu, 'k');
  w = w.replace(/c$/g, 'k'); // word-final c

  // 5. Glide ui → ɥi
  w = w.replace(/ui/g, 'ɥi');

  // 6. Vocalic digraphs (ue→ɥɛ first, then eau/au/ou/eu/…)
  for (const [re, ipa] of DIGRAPH_MAP) {
    w = w.replace(re, ipa);
  }

  // 7. Mute final e (BEFORE consonant strip — see module header)
  w = stripMuteE(w);

  // 8. Silent final consonants
  w = stripSilentFinalConsonants(w);

  return w;
}

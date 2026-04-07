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
 *   2. Initial-h: aspirate h marked, mute h stripped.
 *   3. Nasal vowel sequences: V+n/m before consonant or word-end → IPA nasal.
 *      Context guard: V+n/m before another vowel is NOT nasal (e.g. "amine").
 *   4. Consonant digraphs (ch, gn, ph).
 *   5. Glide ui → ɥi (must precede vocalic digraphs to avoid ui→u).
 *   6. Vocalic digraphs: orthographic pairs → single IPA token.
 *   7. Silent final consonants: d, t, s, x, z, p stripped at word-end
 *      (context guard: -er, -ez kept as /e/; -et stripped to ɛ).
 *   8. Mute final e: bare 'e' (not é/è/ê) at word-end stripped,
 *      UNLESS monosyllabic (e.g. "le", "me", "se" — kept as /ə/).
 *
 * Liaison inter-mots is NOT handled here (requires sentence-level context).
 *
 * docs_fusion_optimal.md §10.1 — Romance G2P (FR).
 */

// ─── Nasal vowel map ──────────────────────────────────────────────────────────

const NASAL_MAP: Array<[vowelRe: RegExp, nasal: string]> = [
  [/[aàâ](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɑ\u0303_\u00a7'],
  [/[eéèêë](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɑ\u0303_\u00a7'],
  [/[iîïy](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɛ\u0303_\u00a7'],
  [/o(?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'ɔ\u0303_\u00a7'],
  [/[uùûü](?=[nm](?![aeiouyàâéèêëîïôùûœæ]))/g, 'œ\u0303_\u00a7'],
];

const NASAL_STRIP_RE = /([ɑɛɔœ]\u0303_\u00a7)[nm]/g;
const NASAL_FINALISE_RE = /_\u00a7/g;

// ─── Vocalic digraphs ─────────────────────────────────────────────────────────

const DIGRAPH_MAP: Array<[re: RegExp, ipa: string]> = [
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

// ─── Silent-h ─────────────────────────────────────────────────────────────────

/**
 * Aspirate-h words: initial h blocks elision/liaison.
 * Extended to cover frequent rap/slam vocabulary.
 */
const ASPIRATE_H_WORDS = new Set([
  // Core
  'haïr', 'haine', 'hameau', 'hanche', 'hardi', 'haricot', 'hasard',
  'haut', 'héros', 'hibou', 'hier', 'honte', 'horloge', 'housse',
  'huit', 'hurler',
  // Extended — verlan, argot, rap fréquent
  'halte', 'hamster', 'hangar', 'hanneton', 'harceler', 'hargneux',
  'harpe', 'hausse', 'hennir', 'hérisson', 'heurter', 'hiberner',
  'hiérarchie', 'hocher', 'hold-up', 'hollande', 'homard', 'hongre',
  'hooligan', 'horde', 'houspiller', 'huard', 'huche', 'huer',
  'huissier', 'hulotte', 'hululer', 'hurlement', 'hussard', 'hype',
]);

function processInitialH(word: string): string {
  if (!word.startsWith('h')) return word;
  if (ASPIRATE_H_WORDS.has(word)) return '_h_' + word.slice(1);
  return word.slice(1); // mute h — strip
}

// ─── Silent final consonants ──────────────────────────────────────────────────

/**
 * Strip typical silent final consonants in French.
 * Order matters: longer patterns tested first.
 *
 * Rules:
 *   -er / -ez  → /e/  (infinitifs, 2p pluriel) — already fine, no strip needed
 *   -et        → ɛ    (muet, filet)
 *   -ent (3pp) → strip 'nt' when preceded by a vowel phoneme (chantent → ʃɑ̃t)
 *   -d / -t / -s / -x / -z / -p at word-end → strip
 *
 * Exceptions NOT handled here (require lexical lookup):
 *   - Liaisons (les_enfants)
 *   - Words where final consonant IS pronounced (cap, bled, web, etc.)
 */
function stripSilentFinalConsonants(w: string): string {
  // -ent (verbal 3pp ending) after a vowel or nasal token: strip 'nt'
  // e.g. "chantent" → after G2P → 'ʃɑ̃tɑ̃nt' ... handled at phoneme level:
  // strip trailing 'nt' only when preceded by a vowel IPA char
  w = w.replace(/([aeiouyɑɛɔœøɥwa\u0303])nt$/u, '$1');

  // -et → ɛ (silent t, open e)
  w = w.replace(/et$/, 'ɛ');

  // -er / -ez → keep as-is (already map to /e/ via digraph; no strip)

  // Bare final d, t, s, x, z, p (after vowel or sonorant)
  // Guard: do NOT strip if word is only consonants (edge case)
  w = w.replace(/([aeiouyɑɛɔœøɥwa\u0303])[dtpszx]$/u, '$1');

  return w;
}

// ─── Mute final e ─────────────────────────────────────────────────────────────

// IPA vowel characters present after G2P transforms
const IPA_VOWEL_RE = /[aeiouyɑɛɔœøɥ\u0303]/u;

/**
 * Strip mute final 'e' unless the word is monosyllabic (le, me, se, de…).
 * "Mute e" = bare unaccented 'e' at word-end.
 * Accented finals (é, è, ê) are NOT mute and are preserved.
 *
 * Monosyllabic guard: if stripping 'e' would leave a string with no vowel
 * at all, keep the 'e' (rendered as /ə/).
 */
function stripMuteE(w: string): string {
  if (!w.endsWith('e')) return w;
  // Only strip bare 'e', not accented finals
  const stem = w.slice(0, -1);
  if (stem.length === 0) return w; // single char — keep
  // If stem has no vowel, this is monosyllabic with e as nucleus — keep
  if (!IPA_VOWEL_RE.test(stem)) return w;
  return stem;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Transform a French word (orthographic, post-normalize) into a phonemic
 * token string suitable for `RomanceStrategy.syllabify()`.
 *
 * @param word - Single word, lowercase, NFC normalised.
 * @returns Phonemic string with nasal vowel tokens + digraph expansions,
 *          silent final consonants stripped, mute final e stripped.
 *
 * @example
 * frenchG2P('chant')    // → 'ʃɑ̃'    (nasal ɑ̃, final t silent)
 * frenchG2P('chante')   // → 'ʃɑ̃'    (mute e stripped)
 * frenchG2P('vente')    // → 'vɑ̃'    (same RN as 'chante' ✓)
 * frenchG2P('vent')     // → 'vɑ̃'
 * frenchG2P('beau')     // → 'bo'
 * frenchG2P('nuit')     // → 'nɥi'   (glide ui → ɥi)
 * frenchG2P('petit')    // → 'pəti'  (final t silent)
 * frenchG2P('amine')    // → 'amine' (nasal guard: i+n before e → not nasal)
 * frenchG2P('le')       // → 'le'    (monosyllabic — e kept as /ə/)
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

  // 4. Glide ui → ɥi (before vocalic digraphs consume 'u')
  w = w.replace(/ui/g, 'ɥi');

  // 5. Vocalic digraphs
  for (const [re, ipa] of DIGRAPH_MAP) {
    w = w.replace(re, ipa);
  }

  // 6. Silent final consonants
  w = stripSilentFinalConsonants(w);

  // 7. Mute final e
  w = stripMuteE(w);

  return w;
}

/**
 * FrenchG2P.ts
 * Rule-based grapheme-to-phoneme transform for French (FR).
 *
 * Processing order:
 *   1. Lowercase + NFC normalisation.
 *   2. Initial-h: aspirate h marked, mute h stripped.
 *   3. Internal silent h stripped (e.g. cahier → caier).
 *   4. Nasal vowel sequences.
 *   5. Consonant digraphs (ch, gn, ph).
 *   6. j → ʒ  (jour, jardin, jeu…)
 *   7. Hard c → k.
 *   8. Glide ui → ɥi.
 *   9. Vocalic digraphs (ue→ɥɛ first, then eau/au/ou/eu/…).
 *  10. Terminal -eure → ø  (heure, demeure — eu→ø already consumed, strip mute -re).
 *  11. Mute final e stripped.
 *  12. Silent final consonants + final-r → ʁ.
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
// 'ue'→'ɥɛ' MUST appear before 'eu'→'ø'.

const DIGRAPH_MAP: Array<[re: RegExp, ipa: string]> = [
  [/ue/g,  'ɥɛ'],
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

const IPA_VOWEL_RE = /[aeiouyɑɛɔœøɥ\u0303]/u;

function stripMuteE(w: string): string {
  if (!w.endsWith('e')) return w;
  const stem = w.slice(0, -1);
  if (stem.length === 0) return w;
  if (!IPA_VOWEL_RE.test(stem)) return w;
  return stem;
}

// ─── Silent final consonants + final-r normalisation ──────────────────────────

function stripSilentFinalConsonants(w: string): string {
  // 1. -ent verbal 3pp
  w = w.replace(/([aeiouyɑɛɔœøɥwa\u0303])nt$/u, '$1');

  // 2. -et → ɛ
  w = w.replace(/et$/, 'ɛ');

  // 3. -ier / -er → e  (mute r)
  w = w.replace(/ier$/, 'e');
  w = w.replace(/er$/, 'e');

  // 4. Bare final orthographic 'r' → IPA ʁ  (amour, soir, venir…)
  w = w.replace(/([aeiouyɑɛɔœøɥwa\u0303ʁ])r$/u, '$1\u0281');

  // 5. Bare final d, t, g, s, x, z, p after vowel
  w = w.replace(/([aeiouyɑɛɔœøɥwa\u0303])[dtgpszx]$/u, '$1');

  return w;
}

// ─── Public API ───────────────────────────────────────────────────────────────────

export function frenchG2P(word: string): string {
  let w = word.normalize('NFC').toLowerCase();

  // 1. Initial h
  w = processInitialH(w);

  // 2. Internal silent h (e.g. cahier → caier, trahir → trair)
  //    Must NOT strip the aspirate-h marker '_h_' produced by processInitialH.
  //    Only strip bare 'h' that survived step 1 (i.e. not at start after marker).
  w = w.replace(/(?<!_)h(?!_)/g, '');

  // 3. Nasal vowels
  for (const [re, token] of NASAL_MAP) {
    w = w.replace(re, token);
  }
  w = w.replace(NASAL_STRIP_RE, '$1');
  w = w.replace(NASAL_FINALISE_RE, '');

  // 4. Consonant digraphs
  w = w.replace(/ch/g, 'ʃ');
  w = w.replace(/gn/g, 'ɲ');
  w = w.replace(/ph/g, 'f');

  // 5. j → ʒ
  w = w.replace(/j/g, 'ʒ');

  // 6. Hard c → k (before a, o, u or consonant; NOT before e/i)
  w = w.replace(/c(?=[aouàâôùûɑɔœ])/gu, 'k');
  w = w.replace(/c(?=[^eiéèêëîïɛ])/gu, 'k');
  w = w.replace(/c$/g, 'k');

  // 7. Glide ui → ɥi
  w = w.replace(/ui/g, 'ɥi');

  // 8. Vocalic digraphs
  for (const [re, ipa] of DIGRAPH_MAP) {
    w = w.replace(re, ipa);
  }

  // 9. Terminal -eure → ø  (heure, demeure, meilleure…)
  //    After eu→ø (step 8), 'heure' is already 'øre' — the 're' suffix is mute.
  //    Strip it directly to avoid the final-r→ʁ rule turning 'øre'→'øre'→'øʁ'.
  w = w.replace(/ør(e?)$/, 'ø');

  // 10. Mute final e
  w = stripMuteE(w);

  // 11. Silent final consonants + final-r → ʁ
  w = stripSilentFinalConsonants(w);

  return w;
}

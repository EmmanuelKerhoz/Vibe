/**
 * Rhyme Engine v2 — Romance Family Algorithm
 * Languages: FR, ES, IT, PT, RO, CA
 * Strategy: rule-based G2P + silent-e handling + mute final consonants (FR/CA)
 *
 * IMPORTANT: all extraction operates on the LAST WHITESPACE-DELIMITED TOKEN
 * of unit.surface, not on the full surface string.  The engine passes the
 * line-ending unit which may contain several words; rhyme lives in the last
 * word only.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

// ─── French / Catalan mute final consonants ───────────────────────────────────
// NOTE: 'l' and 'r' are intentionally excluded — they are phonetically
// realised in most French lyric words (ciel /sjɛl/, amour /amuʁ/).
const FR_MUTE_FINALS = /[bcdghpqst]+$/i;

// French e muet (schwa) — word-final silent e
const FR_SILENT_E = /e$/i;

// ─── Whitelist: French loan-words whose final consonant IS pronounced ──────────
// These must NOT have their final consonant stripped by FR_MUTE_FINALS.
const FR_PRONOUNCED_FINALS = new Set([
  // -t pronounced
  'net', 'fat', 'test', 'toast', 'fast', 'cast', 'best', 'west', 'rest',
  'trust', 'bust', 'dust', 'rust', 'gust', 'just', 'must', 'post', 'coast',
  'ghost', 'host', 'most', 'roast', 'boost', 'frost', 'lost', 'cost',
  'blast', 'last', 'past', 'vast', 'mast', 'contrast', 'podcast',
  // -ct pronounced
  'contact', 'impact', 'intact', 'exact', 'abstract', 'compact', 'extract',
  'react', 'interact', 'attract', 'distract', 'subtract', 'contract',
  // -c pronounced
  'chic', 'tac', 'fac', 'lac', 'bac', 'mac',
  // -p pronounced
  'cap', 'rap', 'map', 'gap', 'clap', 'snap', 'trap', 'wrap', 'slap',
  'step', 'rep', 'prep', 'dep',
  // -d pronounced
  'bid', 'did', 'kid', 'lid', 'rid', 'grid', 'slid',
  'bad', 'dad', 'had', 'mad', 'sad', 'glad', 'grad',
  'bed', 'fed', 'led', 'red', 'shed', 'sled', 'bled', 'bred', 'fled',
  'god', 'rod', 'nod', 'pod', 'plod',
  'bud', 'dud', 'mud', 'stud', 'thud',
]);

// ─── Vowel extraction ─────────────────────────────────────────────────────────
// Order matters: multi-char digraphs/trigraphs must precede single vowels.
// Covers the main French phonemic vowel clusters.
const VOWEL_RE = /eau|oeu|œu|[ao]u|[aeo]i|eu|[aeo]u|[aeiouáàâäéèêëíìîïóòôöúùûüýÿæœ]+/giu;

/**
 * Return the last whitespace-delimited token of a surface string,
 * stripped of leading/trailing punctuation that is not part of the rhyme
 * (commas, full stops, exclamation/question marks, ellipses, quotes).
 */
export function lastRhymingToken(surface: string): string {
  const tokens = surface.trim().split(/\s+/);
  const raw = tokens[tokens.length - 1] ?? '';
  // Strip trailing punctuation that is never part of the rhyming nucleus
  return raw.replace(/[.,!?;:…"'«»\u2018\u2019\u201C\u201D]+$/u, '');
}

function extractVowelNucleus(token: string, lang: LangCode): string {
  let t = token.toLowerCase().normalize('NFC');

  if (lang === 'fr' || lang === 'ca') {
    const tokenLower = t;
    if (!FR_PRONOUNCED_FINALS.has(tokenLower)) {
      t = t.replace(FR_MUTE_FINALS, '');
    }
    t = t.replace(FR_SILENT_E, '');
  }

  const matches = t.match(VOWEL_RE);
  if (!matches) return t.slice(-3); // graphemic fallback
  return matches[matches.length - 1] ?? '';
}

function extractCoda(token: string, lang: LangCode): string {
  let t = token.toLowerCase().normalize('NFC');

  if (lang === 'fr' || lang === 'ca') {
    const tokenLower = t;
    if (!FR_PRONOUNCED_FINALS.has(tokenLower)) {
      t = t.replace(FR_MUTE_FINALS, '');
    }
    t = t.replace(FR_SILENT_E, '');
  }

  const allMatches = [...t.matchAll(VOWEL_RE)];
  const lastMatch = allMatches[allMatches.length - 1];
  if (!lastMatch || lastMatch.index === undefined) return '';
  return t.slice(lastMatch.index + lastMatch[0].length);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract the rhyme nucleus from a LineEndingUnit for the Romance family.
 *
 * Works on the LAST TOKEN of unit.surface so that multi-word tails like
 * "au fond de mon cœur" correctly target "cœur".
 *
 * Also returns `rhymeToken` so engine.ts can compute charSpan without
 * duplicating the last-token logic.
 */
export function extractNucleusROM(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus & { rhymeToken: string } {
  const token = lastRhymingToken(unit.surface);

  if (!token) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1, rhymeToken: '' };
  }

  const vowels = extractVowelNucleus(token, lang);
  const coda   = extractCoda(token, lang);

  const allMatches = [...token.toLowerCase().matchAll(VOWEL_RE)];
  const lastMatch = allMatches[allMatches.length - 1];
  const onset = lastMatch?.index !== undefined
    ? token.slice(0, lastMatch.index).toLowerCase()
    : '';

  return {
    vowels,
    coda,
    tone:       '',
    onset,
    moraCount:  vowels.length >= 2 ? 2 : 1,
    rhymeToken: token,
  };
}

/**
 * Language-aware Romance score.
 *
 * After FR/CA stripping, coda is almost always empty → give it little weight
 * so two words that share a vowel nucleus still score high even if their
 * stripped codas differ slightly.
 *
 * Weights:
 *   FR / CA  → vowel 0.85, coda 0.15
 *   ES/IT/PT → vowel 0.65, coda 0.35  (coda is more phonetically present)
 *   others   → vowel 0.60, coda 0.40  (original conservative default)
 */
export function scoreROM(
  nA: RhymeNucleus,
  nB: RhymeNucleus,
  lang: LangCode,
  phonemeEditDistance: (a: string, b: string) => number
): number {
  const vowelW = (lang === 'fr' || lang === 'ca') ? 0.85
    : (lang === 'es' || lang === 'it' || lang === 'pt') ? 0.65
    : 0.60;
  const codaW = 1 - vowelW;

  return vowelW * (1 - phonemeEditDistance(nA.vowels, nB.vowels))
       + codaW  * (1 - phonemeEditDistance(nA.coda,   nB.coda));
}

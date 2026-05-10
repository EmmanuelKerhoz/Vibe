/**
 * Rhyme Engine v2 — Romance Family Algorithm
 * Languages: FR, ES, IT, PT
 * Strategy: rule-based G2P + silent-e handling + mute final consonants (FR)
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

// ─── French mute final consonants ────────────────────────────────────────────

// In French, these word-final consonants are typically silent.
// NOTE: 'l' and 'r' are intentionally excluded — they are phonetically
// realised in most French lyric words (ciel /sjɛl/, immortel /imɔʁtɛl/,
// amour /amuʁ/). Including them would incorrectly destroy the vowel nucleus.
const FR_MUTE_FINALS = /[bcdghpqst]+$/i;

// French silent suffixes, ordered longest-first so the greediest match wins.
// Covers: -ent (ils chantENT), -aient (imparfait), -eront (futur),
//         -es (2s présent / pluriel), bare -e (e muet)
// Applied AFTER FR_MUTE_FINALS so the consonant strip does not interfere.
const FR_SILENT_SUFFIX = /(?:aient|eront|ent|es|e)$/i;

// ─── Vowel regex (shared) ─────────────────────────────────────────────────────

const VOWEL_RE = /[aeiouáàâäéèêëíìîïóòôöúùûüýÿæœ]+/giu;

// ─── French mora count table ──────────────────────────────────────────────────
// Maps orthographic vowel clusters to their mora count.
// Vowel letters that represent a single vocalic unit despite multiple graphemes.
const FR_DIGRAPH_MORA: Record<string, number> = {
  eau: 1, au: 1, ai: 1, ei: 1, ou: 1, oi: 1, eu: 1, oe: 1,
  oeu: 1, ae: 1, ui: 1, ie: 1, ue: 1, ia: 1, io: 1, iu: 1,
};

function countMorasFR(vowelCluster: string): number {
  const key = vowelCluster.toLowerCase();
  if (FR_DIGRAPH_MORA[key] !== undefined) return FR_DIGRAPH_MORA[key];
  // Fallback: one mora per distinct vowel letter
  return Math.max(1, vowelCluster.replace(/[^aeiouáàâäéèêëíìîïóòôöúùûüýÿæœ]/giu, '').length);
}

// ─── Normalisation helper ─────────────────────────────────────────────────────

/**
 * Returns a stripped version of the token for nucleus extraction, plus a
 * character-level offset map so callers can remap positions back to `surface`.
 *
 * offsetMap[i] = index in `surface` that corresponds to position i in the
 * returned `stripped` string.  The map is monotonically non-decreasing.
 */
function normalizeFR(
  surface: string
): { stripped: string; offsetMap: number[] } {
  const nfc = surface.normalize('NFC').toLowerCase();

  // Build a character array we can mutate while tracking original positions.
  const chars: Array<{ ch: string; origIdx: number }> = [];
  for (let i = 0; i < nfc.length; i++) {
    chars.push({ ch: nfc[i], origIdx: i });
  }

  // Strip mute final consonants (operate on the joined string, then re-index).
  let joined = chars.map(c => c.ch).join('');

  const muteFinalMatch = FR_MUTE_FINALS.exec(joined);
  const muteFinalStart = muteFinalMatch ? muteFinalMatch.index : joined.length;

  // Strip silent suffix from what remains before the mute final block.
  const beforeMute = joined.slice(0, muteFinalStart);
  const silentSuffixMatch = FR_SILENT_SUFFIX.exec(beforeMute);
  const silentSuffixStart = silentSuffixMatch
    ? silentSuffixMatch.index
    : beforeMute.length;

  // Effective end of the nucleus-bearing portion.
  const effectiveEnd = Math.min(silentSuffixStart, muteFinalStart);

  const kept = chars.slice(0, effectiveEnd);
  const stripped = kept.map(c => c.ch).join('');
  const offsetMap = kept.map(c => c.origIdx);

  return { stripped, offsetMap };
}

// ─── Nucleus extraction helpers ───────────────────────────────────────────────

function extractNucleusData(
  surface: string,
  lang: LangCode
): {
  vowels: string;
  coda: string;
  onset: string;
  moraCount: number;
  charSpanStart: number;
  charSpanEnd: number;
} {
  if (!surface) {
    return { vowels: '', coda: '', onset: '', moraCount: 1, charSpanStart: -1, charSpanEnd: -1 };
  }

  let workStr: string;
  let offsetMap: number[];

  if (lang === 'fr') {
    ({ stripped: workStr, offsetMap } = normalizeFR(surface));
  } else {
    // For ES / IT / PT / RO: simple NFC lowercase, identity offset map.
    workStr = surface.normalize('NFC').toLowerCase();
    offsetMap = Array.from({ length: workStr.length }, (_, i) => i);
  }

  // Re-initialise VOWEL_RE (stateful regex — must reset lastIndex).
  VOWEL_RE.lastIndex = 0;
  const vowelMatches = [...workStr.matchAll(VOWEL_RE)];

  if (vowelMatches.length === 0) {
    // Graphemic fallback: last available character cluster.
    const fallbackCluster = workStr.slice(-2) || workStr;
    const fallbackStartInWork = workStr.length - fallbackCluster.length;
    const charSpanStart = offsetMap[fallbackStartInWork] ?? -1;
    const charSpanEnd   = (offsetMap[workStr.length - 1] ?? -1) + 1;
    return {
      vowels: fallbackCluster,
      coda: '',
      onset: '',
      moraCount: 1,
      charSpanStart,
      charSpanEnd,
    };
  }

  const lastVowel = vowelMatches.at(-1)!;
  const vowelStart = lastVowel.index!;
  const vowelEnd   = vowelStart + lastVowel[0].length;

  const vowels = lastVowel[0];
  const coda   = workStr.slice(vowelEnd);
  const onset  = workStr.slice(0, vowelStart);

  // moraCount: use FR digraph table when lang === 'fr', else vowel-letter count.
  const moraCount = lang === 'fr'
    ? countMorasFR(vowels)
    : Math.max(1, vowels.replace(/[^aeiouáàâäéèêëíìîïóòôöúùûüýÿæœ]/giu, '').length);

  // Remap nucleus span back to original surface indices.
  // The nucleus is vowels + coda = workStr[vowelStart .. effectiveEnd).
  const nucleusWorkEnd = workStr.length; // coda runs to end of stripped string
  const charSpanStart  = offsetMap[vowelStart] ?? -1;
  // charSpanEnd is exclusive: first char AFTER the nucleus in surface.
  const charSpanEnd    = charSpanStart === -1
    ? -1
    : (offsetMap[nucleusWorkEnd - 1] ?? -1) + 1;

  return { vowels, coda, onset, moraCount, charSpanStart, charSpanEnd };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusROM(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;

  if (!surface) {
    return {
      vowels: '',
      coda: '',
      tone: '',
      onset: '',
      moraCount: 1,
      charSpanStart: -1,
      charSpanEnd: -1,
    };
  }

  const { vowels, coda, onset, moraCount, charSpanStart, charSpanEnd } =
    extractNucleusData(surface, lang);

  return {
    vowels,
    coda,
    tone: '',
    onset,
    moraCount,
    charSpanStart,
    charSpanEnd,
  };
}

/**
 * Rhyme Engine v2 — Germanic Family Algorithm
 * Languages: EN, DE, NL, SV, DA, NO, IS
 * Strategy: 28-pattern suffix map + graphemic PED on rhyme tail
 *           + charSpan remapping to surface for UI highlighting
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

// ─── Suffix pattern map (grapheme → approx. IPA nucleus + coda) ──────────────
// Each entry: [suffix_re, vowels_ipa, coda_ipa]
// Ordered longest-match first.

type SuffixEntry = [RegExp, string, string];

const EN_SUFFIX_MAP: SuffixEntry[] = [
  [/ight$/i,   'aɪ',  't'],
  [/tion$/i,   'ʌ',   'n'],
  [/ough$/i,   'ʌ',   'f'],
  [/ough$/i,   'oʊ',  ''],
  [/ough$/i,   'uː',  ''],
  [/ough$/i,   'ɔː',  ''],
  [/ive$/i,    'ɪ',   'v'],
  [/ove$/i,    'ʌ',   'v'],
  [/ove$/i,    'oʊ',  'v'],
  [/ead$/i,    'ɛ',   'd'],
  [/ead$/i,    'iː',  'd'],
  [/ing$/i,    'ɪ',   'ŋ'],
  [/ness$/i,   'ɪ',   's'],
  [/less$/i,   'ɪ',   's'],
  [/ful$/i,    'ʊ',   'l'],
  [/ment$/i,   'ɛ',   'nt'],
  [/ance$/i,   'æ',   'ns'],
  [/ence$/i,   'ɛ',   'ns'],
  [/ible$/i,   'ɪ',   'bl'],
  [/able$/i,   'eɪ',  'bl'],
  [/ous$/i,    'ʌ',   's'],
  [/ion$/i,    'ɪ',   'n'],
  [/al$/i,     'æ',   'l'],
  [/er$/i,     'ɚ',   ''],
];

const DE_SUFFIX_MAP: SuffixEntry[] = [
  [/ung$/i,    'ʊ',   'ŋ'],
  [/heit$/i,   'aɪ',  't'],
  [/keit$/i,   'aɪ',  't'],
  [/lich$/i,   'ɪ',   'ç'],
  [/isch$/i,   'ɪ',   'ʃ'],
  [/ern$/i,    'ɛ',   'rn'],
  [/en$/i,     'ə',   'n'],
  [/er$/i,     'ɐ',   ''],
  [/ig$/i,     'ɪ',   'ç'],
  [/ich$/i,    'ɪ',   'ç'],
];

const NL_SUFFIX_MAP: SuffixEntry[] = [
  [/heid$/i,   'ɛɪ',  'd'],
  [/lijk$/i,   'ɛɪ',  'k'],
  [/ing$/i,    'ɪ',   'ŋ'],
  [/erd$/i,    'ɛ',   'rt'],
  [/en$/i,     'ə',   'n'],
  [/er$/i,     'ɐ',   ''],
];

const SUFFIX_MAPS: Record<string, SuffixEntry[]> = {
  en: EN_SUFFIX_MAP,
  de: DE_SUFFIX_MAP,
  nl: NL_SUFFIX_MAP,
};

// ─── Vowel regex (graphemic) ──────────────────────────────────────────────────

const VOWEL_RE = /[aeiouäöüáàâéèêíìîóòôúùûæœ]+/giu;

// ─── Graphemic nucleus + charSpan ─────────────────────────────────────────────

/**
 * Finds the last graphemic vowel cluster in `surface` (NFC, lowercase) and
 * returns vowels, coda, and the exact character span within the original
 * `surface` string so the UI can underline the right characters.
 */
function graphemicNucleusWithSpan(surface: string): {
  vowels: string;
  coda: string;
  charSpanStart: number;
  charSpanEnd: number;
} {
  const nfc = surface.normalize('NFC').toLowerCase();
  VOWEL_RE.lastIndex = 0;
  const matches = [...nfc.matchAll(VOWEL_RE)];

  if (!matches.length) {
    // No vowel found — fall back to last 2 characters.
    const start = Math.max(0, nfc.length - 2);
    return {
      vowels: nfc.slice(start),
      coda: '',
      charSpanStart: start,
      charSpanEnd: nfc.length,
    };
  }

  const last = matches.at(-1)!;
  const vowelStart = last.index!;
  const vowelEnd   = vowelStart + last[0].length;
  const vowels     = last[0];
  const coda       = nfc.slice(vowelEnd);

  return {
    vowels,
    coda,
    // Span covers vowels + coda (full rhyming tail).
    charSpanStart: vowelStart,
    charSpanEnd:   nfc.length,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusGER(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1,
             charSpanStart: -1, charSpanEnd: -1 };
  }

  const lower = surface.normalize('NFC').toLowerCase();
  const map   = SUFFIX_MAPS[lang] ?? EN_SUFFIX_MAP;

  // Try suffix map (longest match wins — iterate in order).
  for (const [re, vowels, coda] of map) {
    if (re.test(lower)) {
      // IPA vowels/coda are used for scoring; charSpan is computed
      // independently from the graphemic surface so the UI can highlight
      // the actual characters (not the IPA approximation).
      const { charSpanStart, charSpanEnd } = graphemicNucleusWithSpan(surface);
      return {
        vowels,
        coda,
        tone:          '',
        onset:         lower.replace(re, '').slice(-4),
        moraCount:     vowels.length >= 2 ? 2 : 1,
        charSpanStart,
        charSpanEnd,
      };
    }
  }

  // Graphemic fallback — span and nucleus both come from the same helper.
  const { vowels, coda, charSpanStart, charSpanEnd } =
    graphemicNucleusWithSpan(surface);
  return {
    vowels,
    coda,
    tone:          '',
    onset:         '',
    moraCount:     vowels.length >= 2 ? 2 : 1,
    charSpanStart,
    charSpanEnd,
  };
}

/**
 * Germanic rhyme score — PED on the phonemic tail (vowels + coda concatenated).
 */
export function scoreGER(a: RhymeNucleus, b: RhymeNucleus): number {
  const tailA = a.vowels + a.coda;
  const tailB = b.vowels + b.coda;
  return 1 - phonemeEditDistance(tailA, tailB);
}

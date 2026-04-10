/**
 * Rhyme Engine v2 — Agglutinative Family Algorithm
 * Languages: TR (Turkish), FI (Finnish), HU (Hungarian)
 *
 * Shared property: vowel harmony — the vowel quality of suffixes is
 * determined by the root vowel. Rhyme operates on the final stem syllable
 * (suffix stripped) rather than the raw surface word-final sequence.
 *
 * TR strategy:
 * - Back vowels: a ı o u → harmony class B
 * - Front vowels: e i ö ü → harmony class F
 * - Suffix strip heuristic: if last 2 chars are vowel+consonant or consonant+vowel,
 *   check if removing them leaves a valid stem nucleus.
 * - Normalise for nucleus: ı→i, ö→o, ü→u (merge harmony variants into base vowel).
 *
 * FI strategy:
 * - Vowel harmony pairs: a⇔ä, o⇔ö, u⇔y — merge pairs for nucleus comparison.
 * - Geminate vowels (aa, oo, ee…) = moraCount 2.
 * - Coda: consonant cluster after last vowel.
 *
 * HU strategy:
 * - Long vowels marked with diacritics: á é í ó ő ú ű ö ü — length preserved.
 * - Front/back harmony class detected from last vowel in stem.
 * - Suffix stripping: remove final -nak/-nek/-ban/-ben/-ra/-re/-val/-vel etc.
 *
 * Scoring: vowel nucleus 60% + coda 40%
 * Harmony class bonus: +0.10 if both nuclei share the same harmony class.
 * (Capped at 1.0)
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

// ─── Turkish ───────────────────────────────────────────────────────────────────

const TR_BACK_VOWELS  = new Set(['a', '\u0131', 'o', 'u']);
const TR_FRONT_VOWELS = new Set(['e', 'i', '\u00f6', '\u00fc']);
const TR_ALL_VOWELS   = new Set([...TR_BACK_VOWELS, ...TR_FRONT_VOWELS]);

// Normalise harmony variants into base vowel for nucleus comparison
const TR_VOWEL_NORM: Record<string, string> = {
  '\u0131': 'i',   // dotless i → i
  '\u00f6': 'o',   // ö → o
  '\u00fc': 'u',   // ü → u
};

// Common Turkish suffixes to strip (ordered longest-first)
const TR_SUFFIXES = [
  'lar', 'ler', 'dan', 'den', 'tan', 'ten', 'nan', 'nen',
  'da', 'de', 'ta', 'te', 'na', 'ne', 'ya', 'ye',
  'in', '\u0131n', '\u00fcn', 'un', 'nin', 'n\u0131n',
  'a', 'e', '\u0131', 'i', 'u', '\u00fc',
];

function stripTRSuffix(token: string): string {
  const lower = token.toLowerCase();
  for (const suf of TR_SUFFIXES) {
    if (lower.endsWith(suf) && lower.length - suf.length >= 2) {
      const stem = lower.slice(0, lower.length - suf.length);
      // Only strip if stem still contains a vowel
      if ([...stem].some(ch => TR_ALL_VOWELS.has(ch))) {
        return stem;
      }
    }
  }
  return lower;
}

function extractTR(surface: string): { vowels: string; coda: string; harmonyClass: 'B' | 'F' | '?' } {
  const stem = stripTRSuffix(surface);
  const chars = [...stem];

  let lastVowelIdx = -1;
  let lastVowel    = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (TR_ALL_VOWELS.has(ch)) { lastVowelIdx = i; lastVowel = ch; }
  }

  const normalized = TR_VOWEL_NORM[lastVowel] ?? lastVowel;
  const coda = lastVowelIdx >= 0 ? chars.slice(lastVowelIdx + 1).join('') : '';
  const harmonyClass: 'B' | 'F' | '?' = TR_BACK_VOWELS.has(lastVowel) ? 'B'
    : TR_FRONT_VOWELS.has(lastVowel) ? 'F' : '?';

  return { vowels: normalized, coda, harmonyClass };
}

// ─── Finnish ───────────────────────────────────────────────────────────────────

const FI_BACK_VOWELS  = new Set(['a', 'o', 'u']);
const FI_FRONT_VOWELS = new Set(['\u00e4', '\u00f6', 'y', 'e', 'i']);
const FI_ALL_VOWELS   = new Set([...FI_BACK_VOWELS, ...FI_FRONT_VOWELS]);

// Merge harmony pairs for comparison
const FI_VOWEL_NORM: Record<string, string> = {
  '\u00e4': 'a',
  '\u00f6': 'o',
  'y':      'u',
};

// Finnish common suffixes
const FI_SUFFIXES = [
  'ssa', 'ss\u00e4', 'sta', 'st\u00e4', 'lle', 'lta', 'lt\u00e4',
  'lla', 'll\u00e4', 'ksi', 'tta', 'tt\u00e4', 'nna', 'nn\u00e4',
  'ko', 'k\u00f6', 'han', 'h\u00e4n',
  'ni', 'si', 'nsa', 'ns\u00e4',
  'an', '\u00e4n', 'en', 'in', 'on', 'un', 'yn',
  'a', '\u00e4',
];

function stripFISuffix(token: string): string {
  const lower = token.toLowerCase();
  for (const suf of FI_SUFFIXES) {
    if (lower.endsWith(suf) && lower.length - suf.length >= 2) {
      const stem = lower.slice(0, lower.length - suf.length);
      if ([...stem].some(ch => FI_ALL_VOWELS.has(ch))) return stem;
    }
  }
  return lower;
}

function extractFI(surface: string): { vowels: string; coda: string; moraCount: number; harmonyClass: 'B' | 'F' | '?' } {
  const stem  = stripFISuffix(surface);
  const lower = stem.toLowerCase();
  const chars = [...lower];

  let lastVowelIdx = -1;
  let lastVowel    = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (FI_ALL_VOWELS.has(ch)) { lastVowelIdx = i; lastVowel = ch; }
  }

  // Geminate vowel check: two identical vowels side-by-side
  const prevCh = lastVowelIdx > 0 ? chars[lastVowelIdx - 1] : undefined;
  const isGeminate = prevCh === lastVowel;
  const moraCount  = isGeminate ? 2 : 1;

  const normalized = FI_VOWEL_NORM[lastVowel] ?? lastVowel;
  const coda = lastVowelIdx >= 0 ? chars.slice(lastVowelIdx + 1).join('') : '';
  const harmonyClass: 'B' | 'F' | '?' = FI_BACK_VOWELS.has(lastVowel) ? 'B'
    : FI_FRONT_VOWELS.has(lastVowel) ? 'F' : '?';

  return { vowels: normalized, coda, moraCount, harmonyClass };
}

// ─── Hungarian ───────────────────────────────────────────────────────────────────

const HU_BACK_VOWELS  = new Set(['a', '\u00e1', 'o', '\u00f3', 'u', '\u00fa']);
const HU_FRONT_VOWELS = new Set(['e', '\u00e9', 'i', '\u00ed', '\u00f6', '\u0151', '\u00fc', '\u0171']);
const HU_ALL_VOWELS   = new Set([...HU_BACK_VOWELS, ...HU_FRONT_VOWELS]);

// Long vowels: preserve á/é/í/ó/ő/ú/ű as distinct (length = phonemic in HU)
const HU_SUFFIXES = [
  'nak', 'nek', 'ban', 'ben', 'b\u00f3l', 'b\u0151l',
  'ra', 're', 'r\u00f3l', 'r\u0151l',
  'val', 'vel', 't\u00f3l', 't\u0151l',
  'hoz', 'h\u00f6z', 'hez',
  'n\u00e1l', 'n\u00e9l',
  'on', 'en', '\u00f6n', '\u00f6n',
  'ba', 'be', 'ig', 'k\u00e9nt',
  'ok', 'ek', '\u00f6k', 'k',
  't', 'tt',
];

function stripHUSuffix(token: string): string {
  const lower = token.toLowerCase();
  for (const suf of HU_SUFFIXES) {
    if (lower.endsWith(suf) && lower.length - suf.length >= 2) {
      const stem = lower.slice(0, lower.length - suf.length);
      if ([...stem].some(ch => HU_ALL_VOWELS.has(ch))) return stem;
    }
  }
  return lower;
}

function extractHU(surface: string): { vowels: string; coda: string; moraCount: number; harmonyClass: 'B' | 'F' | '?' } {
  const stem  = stripHUSuffix(surface);
  const chars = [...stem.toLowerCase()];

  let lastVowelIdx = -1;
  let lastVowel    = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (HU_ALL_VOWELS.has(ch)) { lastVowelIdx = i; lastVowel = ch; }
  }

  // Long vowels = moraCount 2
  const isLong     = /[\u00e1\u00e9\u00ed\u00f3\u0151\u00fa\u0171]/u.test(lastVowel);
  const moraCount  = isLong ? 2 : 1;
  const coda       = lastVowelIdx >= 0 ? chars.slice(lastVowelIdx + 1).join('') : '';
  const harmonyClass: 'B' | 'F' | '?' = HU_BACK_VOWELS.has(lastVowel) ? 'B'
    : HU_FRONT_VOWELS.has(lastVowel) ? 'F' : '?';

  return { vowels: lastVowel, coda, moraCount, harmonyClass };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface AGGNucleus extends RhymeNucleus {
  harmonyClass: 'B' | 'F' | '?';
}

export function extractNucleusAGG(
  unit: LineEndingUnit,
  lang: LangCode
): AGGNucleus {
  const { surface } = unit;
  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1, harmonyClass: '?' };
  }

  let vowels = '', coda = '', moraCount = 1, harmonyClass: 'B' | 'F' | '?' = '?';

  if (lang === 'tr') {
    const r = extractTR(surface);
    vowels = r.vowels; coda = r.coda; harmonyClass = r.harmonyClass;
  } else if (lang === 'fi') {
    const r = extractFI(surface);
    vowels = r.vowels; coda = r.coda; moraCount = r.moraCount; harmonyClass = r.harmonyClass;
  } else {
    // hu or unknown agglutinative
    const r = extractHU(surface);
    vowels = r.vowels; coda = r.coda; moraCount = r.moraCount; harmonyClass = r.harmonyClass;
  }

  return { vowels, coda, tone: '', onset: '', moraCount, harmonyClass };
}

export function scoreAGG(a: AGGNucleus, b: AGGNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  const base    = 0.60 * vowSim + 0.40 * codaSim;

  // Harmony class bonus: same class = rhyme feels more natural in these languages
  const harmonyBonus = (
    a.harmonyClass !== '?' &&
    b.harmonyClass !== '?' &&
    a.harmonyClass === b.harmonyClass
  ) ? 0.10 : 0;

  return Math.min(1, base + harmonyBonus);
}

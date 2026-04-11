/**
 * Rhyme Engine v2 — FIN Family Algorithm
 * Languages: FI (Finnish), HU (Hungarian)
 *
 * Shared property: vowel harmony + agglutinative morphology.
 * Rhyme operates on the stem nucleus after suffix stripping.
 *
 * FI strategy:
 * - Harmony pairs: a⇔ä, o⇔ö, u⇔y — merged to base for comparison.
 * - Geminate vowels (aa, oo, ee…) → moraCount 2 (phonemically long).
 * - Coda = consonant cluster after last vowel.
 * - Suffix list covers the most common Finnish case suffixes.
 *
 * HU strategy:
 * - Long vowels marked with diacritics: á é í ó ő ú ű — phonemically distinct.
 *   Length preserved in vowel string (not normalised away).
 * - Front/back harmony class from last vowel in stem.
 * - Suffix stripping: nominal cases + possessive suffixes.
 *
 * Scoring: vowel 60% + coda 40%
 * Harmony bonus: +0.10 if both nuclei share harmony class (capped at 1.0).
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

// ─── Finnish ──────────────────────────────────────────────────────────────────

const FI_BACK_VOWELS  = new Set(['a', 'o', 'u']);
const FI_FRONT_VOWELS = new Set(['\u00e4', '\u00f6', 'y', 'e', 'i']);
const FI_ALL_VOWELS   = new Set([...FI_BACK_VOWELS, ...FI_FRONT_VOWELS]);

const FI_VOWEL_NORM: Record<string, string> = {
  '\u00e4': 'a',
  '\u00f6': 'o',
  'y':      'u',
};

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
  const chars = [...stem.toLowerCase()];

  let lastVowelIdx = -1;
  let lastVowel    = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (FI_ALL_VOWELS.has(ch)) { lastVowelIdx = i; lastVowel = ch; }
  }

  const prevCh     = lastVowelIdx > 0 ? chars[lastVowelIdx - 1] : undefined;
  const isGeminate = prevCh === lastVowel;
  const moraCount  = isGeminate ? 2 : 1;
  const normalized = FI_VOWEL_NORM[lastVowel] ?? lastVowel;
  const coda       = lastVowelIdx >= 0 ? chars.slice(lastVowelIdx + 1).join('') : '';
  const harmonyClass: 'B' | 'F' | '?' =
    FI_BACK_VOWELS.has(lastVowel)  ? 'B' :
    FI_FRONT_VOWELS.has(lastVowel) ? 'F' : '?';

  return { vowels: normalized, coda, moraCount, harmonyClass };
}

// ─── Hungarian ────────────────────────────────────────────────────────────────

const HU_BACK_VOWELS  = new Set(['a', '\u00e1', 'o', '\u00f3', 'u', '\u00fa']);
const HU_FRONT_VOWELS = new Set(['e', '\u00e9', 'i', '\u00ed', '\u00f6', '\u0151', '\u00fc', '\u0171']);
const HU_ALL_VOWELS   = new Set([...HU_BACK_VOWELS, ...HU_FRONT_VOWELS]);

const HU_SUFFIXES = [
  'nak', 'nek', 'ban', 'ben', 'b\u00f3l', 'b\u0151l',
  'ra', 're', 'r\u00f3l', 'r\u0151l',
  'val', 'vel', 't\u00f3l', 't\u0151l',
  'hoz', 'h\u00f6z', 'hez',
  'n\u00e1l', 'n\u00e9l',
  'on', 'en', '\u00f6n',
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

  const isLong    = /[\u00e1\u00e9\u00ed\u00f3\u0151\u00fa\u0171]/u.test(lastVowel);
  const moraCount = isLong ? 2 : 1;
  const coda      = lastVowelIdx >= 0 ? chars.slice(lastVowelIdx + 1).join('') : '';
  const harmonyClass: 'B' | 'F' | '?' =
    HU_BACK_VOWELS.has(lastVowel)  ? 'B' :
    HU_FRONT_VOWELS.has(lastVowel) ? 'F' : '?';

  return { vowels: lastVowel, coda, moraCount, harmonyClass };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface FINNucleus extends RhymeNucleus {
  harmonyClass: 'B' | 'F' | '?';
}

export function extractNucleusFIN(
  unit: LineEndingUnit,
  lang: LangCode
): FINNucleus {
  const { surface } = unit;
  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1, harmonyClass: '?' };
  }

  let vowels = '', coda = '', moraCount = 1, harmonyClass: 'B' | 'F' | '?' = '?';

  if (lang === 'fi') {
    const r = extractFI(surface);
    vowels = r.vowels; coda = r.coda; moraCount = r.moraCount; harmonyClass = r.harmonyClass;
  } else {
    // hu
    const r = extractHU(surface);
    vowels = r.vowels; coda = r.coda; moraCount = r.moraCount; harmonyClass = r.harmonyClass;
  }

  return { vowels, coda, tone: '', onset: '', moraCount, harmonyClass };
}

export function scoreFIN(a: FINNucleus, b: FINNucleus): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  const base    = 0.60 * vowSim + 0.40 * codaSim;
  const harmonyBonus = (
    a.harmonyClass !== '?' &&
    b.harmonyClass !== '?' &&
    a.harmonyClass === b.harmonyClass
  ) ? 0.10 : 0;
  return Math.min(1, base + harmonyBonus);
}

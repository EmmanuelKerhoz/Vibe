/**
 * Rhyme Engine v2 — TRK Family Algorithm
 * Languages: TR (Turkish)
 *
 * Turkish vowel harmony:
 * - Back vowels:  a ı o u  → harmony class B
 * - Front vowels: e i ö ü  → harmony class F
 * Suffixes inflect in harmony with the root; stripping them exposes
 * the stem nucleus, which is the phonologically relevant rhyme unit.
 *
 * Strategy:
 * 1. Strip common Turkish case/number/possessive suffixes (longest-first).
 * 2. Extract last vowel of the stem.
 * 3. Normalise harmony variants → base vowel: ı→i, ö→o, ü→u.
 * 4. Coda = consonants after last vowel.
 * 5. Harmony class = back (B) | front (F) | unknown (?).
 *
 * Scoring: vowel 60% + coda 40%
 * Harmony bonus: +0.10 if both nuclei share the same harmony class (capped at 1.0).
 * Rationale: two words with different harmony classes cannot naturally rhyme
 * in Turkish verse; same class = stronger auditory affinity.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

const TR_BACK_VOWELS  = new Set(['a', '\u0131', 'o', 'u']);
const TR_FRONT_VOWELS = new Set(['e', 'i', '\u00f6', '\u00fc']);
const TR_ALL_VOWELS   = new Set([...TR_BACK_VOWELS, ...TR_FRONT_VOWELS]);

const TR_VOWEL_NORM: Record<string, string> = {
  '\u0131': 'i',
  '\u00f6': 'o',
  '\u00fc': 'u',
};

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
      if ([...stem].some(ch => TR_ALL_VOWELS.has(ch))) return stem;
    }
  }
  return lower;
}

export interface TRKNucleus extends RhymeNucleus {
  harmonyClass: 'B' | 'F' | '?';
}

export function extractNucleusTRK(
  unit: LineEndingUnit,
  _lang: LangCode
): TRKNucleus {
  const { surface } = unit;
  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1, harmonyClass: '?' };
  }

  const stem  = stripTRSuffix(surface);
  const chars = [...stem];

  let lastVowelIdx = -1;
  let lastVowel    = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (TR_ALL_VOWELS.has(ch)) { lastVowelIdx = i; lastVowel = ch; }
  }

  const normalized   = TR_VOWEL_NORM[lastVowel] ?? lastVowel;
  const coda         = lastVowelIdx >= 0 ? chars.slice(lastVowelIdx + 1).join('') : '';
  const harmonyClass: 'B' | 'F' | '?' =
    TR_BACK_VOWELS.has(lastVowel)  ? 'B' :
    TR_FRONT_VOWELS.has(lastVowel) ? 'F' : '?';

  return { vowels: normalized, coda, tone: '', onset: '', moraCount: 1, harmonyClass };
}

export function scoreTRK(a: TRKNucleus, b: TRKNucleus): number {
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

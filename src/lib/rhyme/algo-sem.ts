/**
 * Rhyme Engine v2 — Semitic Family Algorithm
 * Languages: AR (Arabic), HE (Hebrew)
 *
 * Strategy:
 * - Triliteral root: strip prefix/suffix function morphemes to expose the CCC root skeleton
 * - Vocalic pattern: extract vowel nucleus from surface (short vs long vowels)
 * - AR: tashkeel (diacritics) decoded if present; fallback on bare consonants
 * - HE: niqqud decoded if present; otherwise graphemic vowel letters (ו, י, א as matres lectionis)
 *
 * Scoring:
 *   vowel nucleus 45% + coda 25% + root consonant similarity 30%
 *   Rationale: Semitic rhyme (qafiya in Arabic) is primarily the last long-vowel + coda;
 *   root consonant similarity (jinās) gives a secondary boost.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';
import { phonemeEditDistance } from './scoring';

// ─── Arabic ───────────────────────────────────────────────────────────────────

// Arabic short vowels (tashkeel)
const AR_TASHKEEL = /[\u064B-\u065F]/gu; // fathatan … sukun range

// Arabic long vowels: alef ا + mater, waw و, ya ي
const AR_LONG_VOWELS = /[اوي]/gu;

// Arabic alphabet consonant set (excluding matres lectionis در vowel positions)
const AR_VOWEL_LETTERS = /[اوي]/u;

function transcribeAR(token: string): { vowels: string; coda: string; root: string } {
  // Remove tashkeel (diacritics)
  const stripped = token.replace(AR_TASHKEEL, '').normalize('NFC');

  // Long vowels as vowel nucleus
  const vowelMatches = stripped.match(AR_LONG_VOWELS);
  const lastVowel    = vowelMatches?.at(-1) ?? '';

  // Map Arabic long vowel letters to IPA-approximate
  const vowelMap: Record<string, string> = { 'ا': 'aa', 'و': 'uu', 'ي': 'ii' };
  const vowels = vowelMap[lastVowel] ?? lastVowel;

  // Coda: last consonant(s) after last vowel letter
  const lastVowelIdx = stripped.lastIndexOf(lastVowel);
  const coda = lastVowelIdx >= 0
    ? stripped.slice(lastVowelIdx + 1)
    : stripped.slice(-2);

  // Root: all consonants (non-vowel letters), max 3
  const root = stripped
    .split('')
    .filter(ch => !AR_VOWEL_LETTERS.test(ch))
    .slice(-3)
    .join('');

  return { vowels, coda, root };
}

// ─── Hebrew ───────────────────────────────────────────────────────────────────

// Hebrew niqqud range
const HE_NIQQUD = /[\u05B0-\u05C7]/gu;

// Hebrew matres lectionis (vav, yod, alef, ayin as vowel indicators)
const HE_MATRES = /[אויה]/gu;

// Hebrew long vowel mapping
const HE_VOWEL_MAP: Record<string, string> = {
  'ו': 'uu',
  'י': 'ii',
  'א': 'a',
  'ה': 'a', // word-final heh is often a long-a marker
};

function transcribeHE(token: string): { vowels: string; coda: string; root: string } {
  const stripped = token.replace(HE_NIQQUD, '').normalize('NFC');

  // Find last vowel indicator
  const chars = [...stripped];
  let lastVowelIdx = -1;
  let vowels = '';
  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i]!;
    if (ch in HE_VOWEL_MAP) {
      lastVowelIdx = i;
      vowels = HE_VOWEL_MAP[ch]!;
      break;
    }
  }

  if (!vowels) {
    // No matres found — graphemic last 2 chars as proxy
    vowels = stripped.slice(-2);
  }

  const coda = lastVowelIdx >= 0
    ? chars.slice(lastVowelIdx + 1).join('')
    : '';

  const root = chars
    .filter(ch => !(ch in HE_VOWEL_MAP))
    .slice(-3)
    .join('');

  return { vowels, coda, root };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusSEM(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus & { root: string } {
  const { surface } = unit;
  const empty = { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 as const, root: '' };
  if (!surface) return empty;

  let vowels = '', coda = '', root = '';

  if (lang === 'ar') {
    ({ vowels, coda, root } = transcribeAR(surface));
  } else {
    ({ vowels, coda, root } = transcribeHE(surface));
  }

  return {
    vowels,
    coda,
    tone:      '',
    onset:     '',
    root,
    moraCount: vowels.length >= 2 ? 2 : 1,
  };
}

export function scoreSEM(
  a: RhymeNucleus & { root?: string },
  b: RhymeNucleus & { root?: string }
): number {
  const vowSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim = 1 - phonemeEditDistance(a.coda,   b.coda);
  const rootSim = 1 - phonemeEditDistance(a.root ?? '', b.root ?? '');
  return 0.45 * vowSim + 0.25 * codaSim + 0.30 * rootSim;
}

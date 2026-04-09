/**
 * Rhyme Engine v2 — CRV Family Algorithm
 * Languages: BK, CB, OG, HA
 */

import type { LineEndingUnit, RhymeNucleus } from './types';

const SONORITY: Record<string, number> = {
  a: 7, e: 7, i: 6, o: 7, u: 6,
  l: 5, r: 5,
  m: 4, n: 4, 'ŋ': 4,
  v: 3, z: 3, 'ʒ': 3,
  f: 2, s: 2, 'ʃ': 2, h: 1,
  b: 2, d: 2, g: 2,
  p: 1, t: 1, k: 1,
};

function sonority(c: string): number {
  return SONORITY[c.toLowerCase()] ?? 0;
}

function isVowel(c: string): boolean {
  return sonority(c) >= 6;
}

function extractCVCNucleus(token: string): { vowels: string; coda: string; onset: string } {
  const lower = token.toLowerCase().normalize('NFC');
  const chars = [...lower];
  let onset = '', vowels = '', coda = '';
  let i = 0;

  while (i < chars.length && !isVowel(chars[i] ?? '')) {
    onset += chars[i++] ?? '';
  }
  while (i < chars.length && isVowel(chars[i] ?? '')) {
    vowels += chars[i++] ?? '';
  }
  while (i < chars.length) {
    const cur  = sonority(chars[i] ?? '');
    const nextChar = chars[i + 1];
    const next = nextChar !== undefined ? sonority(nextChar) : -1;
    if (next > cur) break;
    coda += chars[i++] ?? '';
  }

  if (!vowels) return { vowels: lower, coda: '', onset: '' };
  return { vowels, coda, onset };
}

function moraCount(vowels: string): number {
  if (/([aeiouáàâéèêíìîóòôúùû])\1/iu.test(vowels)) return 2;
  if (/[āēīōūǖ]/iu.test(vowels)) return 2;
  if (vowels.length >= 2) return 2;
  return 1;
}

export function extractNucleusCRV(
  unit: LineEndingUnit,
  lowResource = false
): RhymeNucleus {
  if (lowResource || !unit.surface) {
    const tail = unit.surface.slice(-3).toLowerCase();
    return { vowels: tail, coda: '', tone: '', onset: '', moraCount: 1 };
  }
  const { vowels, coda, onset } = extractCVCNucleus(unit.surface);
  return { vowels, coda, tone: '', onset, moraCount: moraCount(vowels) };
}

/**
 * Rhyme Engine v2 — CRV Family Algorithm
 * Languages: BK, CB, OG, HA
 *
 * HA (Haoussa) is a Chadic language with lexical tones (H/L/falling).
 * Tonal extraction is applied for HA; other CRV langs remain atonal.
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

// ─── Haoussa tone extraction ─────────────────────────────────────────────────────
// Haoussa tone notation: acute = H, grave = L, circumflex/macron = falling/low
const HA_TONE_MAP: Array<[RegExp, string]> = [
  [/[\u0301]/u, 'H'],   // combining acute
  [/[\u0300]/u, 'L'],   // combining grave
  [/[\u0302\u0304]/u, 'F'], // circumflex / macron → falling
];

function extractHATone(token: string): string {
  const nfd = token.normalize('NFD');
  for (const [re, tone] of HA_TONE_MAP) {
    if (re.test(nfd)) return tone;
  }
  return 'M'; // mid / unmarked
}

// ─── Sonority ladder ───────────────────────────────────────────────────────────────────

const SONORITY: Record<string, number> = {
  a: 7, e: 7, i: 6, o: 7, u: 6,
  l: 5, r: 5,
  m: 4, n: 4, '\u014b': 4,
  v: 3, z: 3, '\u0292': 3,
  f: 2, s: 2, '\u0283': 2, h: 1,
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
    const cur      = sonority(chars[i] ?? '');
    const nextChar = chars[i + 1];
    const next     = nextChar !== undefined ? sonority(nextChar) : -1;
    if (next > cur) break;
    coda += chars[i++] ?? '';
  }

  if (!vowels) return { vowels: lower, coda: '', onset: '' };
  return { vowels, coda, onset };
}

function moraCount(vowels: string): number {
  if (/([aeiou\u00e1\u00e0\u00e2\u00e9\u00e8\u00ea\u00ed\u00ec\u00ee\u00f3\u00f2\u00f4\u00fa\u00f9\u00fb])\1/iu.test(vowels)) return 2;
  if (/[\u0101\u0113\u012b\u014d\u016b\u01d6]/iu.test(vowels)) return 2;
  if (vowels.length >= 2) return 2;
  return 1;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusCRV(
  unit: LineEndingUnit,
  lowResource = false,
  lang: LangCode | string = ''
): RhymeNucleus {
  if (lowResource || !unit.surface) {
    const tail = unit.surface.slice(-3).toLowerCase();
    return { vowels: tail, coda: '', tone: '', onset: '', moraCount: 1 };
  }

  const { vowels, coda, onset } = extractCVCNucleus(unit.surface);

  // Haoussa: extract tonal class from the surface form (NFD diacritics)
  const tone = lang === 'ha' ? extractHATone(unit.surface) : '';

  return { vowels, coda, tone, onset, moraCount: moraCount(vowels) };
}

/**
 * CRV score.
 * For HA (Haoussa): tone participates (20%) given lexical tone significance.
 * For other CRV langs: atonal — vowel 55% + coda 45%.
 */
export function scoreCRV(
  a: RhymeNucleus,
  b: RhymeNucleus,
  lang: LangCode | string = ''
): number {
  const isHA = lang === 'ha';

  // Vowel similarity
  const vSim = vowelSimilarity(a.vowels, b.vowels);

  // Coda similarity
  const cSim = a.coda === b.coda ? 1.0
    : a.coda && b.coda && a.coda[0] === b.coda[0] ? 0.5
    : 0.0;

  if (isHA) {
    // Tonal score for Haoussa
    let tSim: number;
    if (a.tone === b.tone) {
      tSim = 1.0;
    } else if (a.tone === 'F' || b.tone === 'F') {
      tSim = 0.5;
    } else {
      tSim = 0.0;
    }
    return 0.55 * vSim + 0.25 * cSim + 0.20 * tSim;
  }

  return 0.55 * vSim + 0.45 * cSim;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function vowelSimilarity(a: string, b: string): number {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  if (a === b) return 1.0;
  if (a.at(-1) === b.at(-1)) return 0.8;
  if (a[0] === b[0]) return 0.4;
  return 0.0;
}

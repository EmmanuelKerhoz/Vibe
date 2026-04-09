/**
 * Rhyme Engine v2 — CRV Family Algorithm
 * Languages: BK (Bété-Kouya), CB (Côtier-Bété), OG (Oubi-Grebo), HA (Hausa)
 * Strategy: CVC-SSP syllabification + mora weight + lowResourceFallback flag
 */

import type { LineEndingUnit, RhymeNucleus } from './types';

// ─── Sonority Sequencing Principle weights ───────────────────────────────────

const SONORITY: Record<string, number> = {
  a: 7, e: 7, i: 6, o: 7, u: 6,         // open/mid vowels
  l: 5, r: 5,                             // liquids
  m: 4, n: 4, 'ŋ': 4,                    // nasals
  v: 3, z: 3, 'ʒ': 3,                    // voiced fricatives
  f: 2, s: 2, 'ʃ': 2, 'h': 1,           // voiceless fricatives
  b: 2, d: 2, g: 2,                       // voiced stops
  p: 1, t: 1, k: 1, 'kp': 1, 'gb': 1,   // voiceless stops
};

function sonority(c: string): number {
  return SONORITY[c.toLowerCase()] ?? 0;
}

function isVowel(c: string): boolean {
  return sonority(c) >= 6;
}

// ─── CVC syllabification (SSP-aware) ─────────────────────────────────────────

function extractCVCNucleus(token: string): { vowels: string; coda: string; onset: string } {
  const lower = token.toLowerCase().normalize('NFC');
  const chars = [...lower];

  let onset = '';
  let vowels = '';
  let coda = '';
  let i = 0;

  // Onset: rising sonority
  while (i < chars.length && !isVowel(chars[i])) {
    onset += chars[i++];
  }

  // Nucleus: vowel peak
  while (i < chars.length && isVowel(chars[i])) {
    vowels += chars[i++];
  }

  // Coda: falling sonority (SSP)
  while (i < chars.length) {
    const cur  = sonority(chars[i]);
    const next = i + 1 < chars.length ? sonority(chars[i + 1]) : -1;
    if (next > cur) break; // rising sonority = next onset, stop
    coda += chars[i++];
  }

  // Fallback: if no vowel found, treat full token as nucleus
  if (!vowels) {
    return { vowels: lower, coda: '', onset: '' };
  }

  return { vowels, coda, onset };
}

// ─── Mora count ───────────────────────────────────────────────────────────────

function moraCount(vowels: string): number {
  // Long vowels (doubled or with macron) = 2 morae
  if (/([aeiouáàâéèêíìîóòôúùû])\1/iu.test(vowels)) return 2;
  if (/[āēīōūǖ]/iu.test(vowels)) return 2;
  if (vowels.length >= 2) return 2;
  return 1;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusCRV(
  unit: LineEndingUnit,
  lowResource = false
): RhymeNucleus {
  if (lowResource || !unit.surface) {
    // Low-resource fallback: graphemic tail only
    const tail = unit.surface.slice(-3).toLowerCase();
    return {
      vowels:    tail,
      coda:      '',
      tone:      '',
      onset:     '',
      moraCount: 1,
    };
  }

  const { vowels, coda, onset } = extractCVCNucleus(unit.surface);
  return {
    vowels,
    coda,
    tone:      '', // CRV not primarily tonal in nucleus
    onset,
    moraCount: moraCount(vowels),
  };
}

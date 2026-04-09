/**
 * Rhyme Engine v2 — BNT Family Algorithm
 * Languages: SW (Swahili), YO (Yoruba)
 * Strategy: vowel assonance on final nucleus + YO tonal weight ×0.6
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

// ─── YO tone extraction ───────────────────────────────────────────────────────

// Yoruba tones: acute=H, grave=L, no mark=M
const YO_TONE_MAP: Array<[RegExp, string]> = [
  [/[áéíóúǹḿ]/u,  'H'],
  [/[àèìòùǹ̀]/u,   'L'],
];

function extractYOTone(token: string): string {
  const nfd = token.normalize('NFD');
  if (/[\u0301]/u.test(nfd)) return 'H';
  if (/[\u0300]/u.test(nfd)) return 'L';
  return 'M';
}

// ─── Vowel nucleus extraction ─────────────────────────────────────────────────

const BANTU_VOWELS = /[aeiouáàâéèêíìîóòôúùûæœ]+/giu;

function extractBantuVowels(token: string): string {
  const lower   = token.toLowerCase().normalize('NFC');
  const matches = [...lower.matchAll(BANTU_VOWELS)];
  // Return last vowel cluster (final syllable nucleus)
  return matches.at(-1)?.[0] ?? lower.slice(-2);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusBNT(
  unit: LineEndingUnit,
  lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  const vowels = extractBantuVowels(surface);
  const tone   = lang === 'yo' ? extractYOTone(surface) : '';

  // Coda: consonants after last vowel cluster
  const lower    = surface.toLowerCase().normalize('NFC');
  const matches  = [...lower.matchAll(BANTU_VOWELS)];
  const last     = matches.at(-1);
  const coda     = last
    ? lower.slice((last.index ?? 0) + last[0].length)
    : '';

  return {
    vowels,
    coda,
    tone,
    onset:     '',
    moraCount: vowels.length >= 2 ? 2 : 1,
  };
}

/**
 * BNT score: vowel assonance dominant.
 * YO: tone contributes 30% (weight 0.6 normalized to 30%).
 */
export function scoreBNT(
  a: RhymeNucleus,
  b: RhymeNucleus,
  lang: LangCode
): number {
  const vSim  = a.vowels === b.vowels ? 1 : 0; // strict vowel identity for BNT
  const cSim  = a.coda   === b.coda   ? 1 : 0;

  if (lang === 'yo') {
    const toneMatch = a.tone && b.tone ? (a.tone === b.tone ? 1 : 0) : 0.5;
    // vowel 50% + coda 20% + tone 30%
    return 0.5 * vSim + 0.2 * cSim + 0.3 * toneMatch;
  }

  // Swahili and other BNT: vowel 70% + coda 30%
  return 0.7 * vSim + 0.3 * cSim;
}

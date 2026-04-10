/**
 * Rhyme Engine v2 — BNT Family Algorithm
 * Languages: SW (Swahili)
 * yo (Yoruba) was removed — it now routes to YRB (algo-yrb.ts).
 *
 * Strategy: vowel assonance on final nucleus
 * Scoring: vowel 70% + coda 30%
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

// ─── Vowel nucleus extraction ─────────────────────────────────────────────────

const BANTU_VOWELS = /[aeiouáàâéèêíìîóòôúùûæœ]+/giu;

function extractBantuVowels(token: string): string {
  const lower   = token.toLowerCase().normalize('NFC');
  const matches = [...lower.matchAll(BANTU_VOWELS)];
  return matches.at(-1)?.[0] ?? lower.slice(-2);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusBNT(
  unit: LineEndingUnit,
  _lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1 };

  const vowels = extractBantuVowels(surface);

  const lower   = surface.toLowerCase().normalize('NFC');
  const matches = [...lower.matchAll(BANTU_VOWELS)];
  const last    = matches.at(-1);
  const coda    = last
    ? lower.slice((last.index ?? 0) + last[0].length)
    : '';

  return {
    vowels,
    coda,
    tone:      '',
    onset:     '',
    moraCount: vowels.length >= 2 ? 2 : 1,
  };
}

/**
 * BNT score: vowel assonance dominant.
 * Swahili: vowel 70% + coda 30%.
 */
export function scoreBNT(
  a: RhymeNucleus,
  b: RhymeNucleus,
  _lang: LangCode
): number {
  const vSim = a.vowels === b.vowels ? 1 : 0;
  const cSim = a.coda   === b.coda   ? 1 : 0;
  return 0.7 * vSim + 0.3 * cSim;
}

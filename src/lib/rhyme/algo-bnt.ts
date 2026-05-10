/**
 * Rhyme Engine v2 — BNT Family Algorithm
 * Languages: SW (Swahili), LG (Luganda), RW (Kinyarwanda), SN (Shona),
 *            ZU (Zulu), XH (Xhosa), NY (Chichewa), BM (Bambara),
 *            FF (Fula/Fulfulde), JV (Javanese)
 *
 * Strategy: vowel assonance on final nucleus
 * Scoring: vowel similarity 65% + coda 25% + mora 10%
 */

import type { LineEndingUnit, LangCode, RhymeNucleus } from './types';

// ─── Vowel nucleus extraction ──────────────────────────────────────────────────

const BANTU_VOWELS = /[aeiou\u00e1\u00e0\u00e2\u00e9\u00e8\u00ea\u00ed\u00ec\u00ee\u00f3\u00f2\u00f4\u00fa\u00f9\u00fb\u00e6\u0153]+/giu;

function extractBantuVowels(token: string): string {
  const lower   = token.toLowerCase().normalize('NFC');
  const matches = [...lower.matchAll(BANTU_VOWELS)];
  return matches.at(-1)?.[0] ?? lower.slice(-2);
}

// ─── charSpan helper ──────────────────────────────────────────────────────────

function surfaceSpanBNT(surface: string): { charSpanStart: number; charSpanEnd: number } {
  const nfc = surface.normalize('NFC').toLowerCase();
  const re = /[aeiou\u00e1\u00e0\u00e2\u00e9\u00e8\u00ea\u00ed\u00ec\u00ee\u00f3\u00f2\u00f4\u00fa\u00f9\u00fb\u00e6\u0153]+/giu;
  const matches = [...nfc.matchAll(re)];
  if (!matches.length) {
    const start = Math.max(0, nfc.length - 2);
    return { charSpanStart: start, charSpanEnd: nfc.length };
  }
  const last = matches.at(-1)!;
  return {
    charSpanStart: last.index!,
    charSpanEnd:   nfc.length,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function extractNucleusBNT(
  unit: LineEndingUnit,
  _lang: LangCode
): RhymeNucleus {
  const { surface } = unit;
  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1,
             charSpanStart: -1, charSpanEnd: -1 };
  }

  const vowels = extractBantuVowels(surface);

  const lower   = surface.toLowerCase().normalize('NFC');
  const matches = [...lower.matchAll(BANTU_VOWELS)];
  const last    = matches.at(-1);
  const coda    = last
    ? lower.slice((last.index ?? 0) + last[0].length)
    : '';

  const { charSpanStart, charSpanEnd } = surfaceSpanBNT(surface);

  return {
    vowels,
    coda,
    tone:      '',
    onset:     '',
    moraCount: vowels.length >= 2 ? 2 : 1,
    charSpanStart,
    charSpanEnd,
  };
}

/**
 * BNT score: vowel assonance dominant.
 * vowel similarity 65% + coda 25% + mora match 10%.
 */
export function scoreBNT(
  a: RhymeNucleus,
  b: RhymeNucleus,
  _lang: LangCode
): number {
  const vSim = vowelSimilarity(a.vowels, b.vowels);

  const cSim = a.coda === b.coda ? 1.0
    : a.coda && b.coda && a.coda[0] === b.coda[0] ? 0.5
    : 0.0;

  const mSim = a.moraCount === b.moraCount ? 1.0 : 0.0;

  return 0.65 * vSim + 0.25 * cSim + 0.10 * mSim;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function vowelSimilarity(a: string, b: string): number {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  if (a === b) return 1.0;
  if (a.at(-1) === b.at(-1)) return 0.8;
  if (a[0] === b[0]) return 0.35;
  return 0.0;
}

/**
 * Rhyme Engine v2 — Yoruboid Family Algorithm
 * Languages: YO (Yoruba)
 *
 * Yoruba is NOT Bantu and NOT KWA in the strict linguistic sense.
 * It belongs to the Yoruboid branch of Volta-Niger (Niger-Congo).
 * Key phonological properties:
 * - Strictly tonal: 3 levels H / M / L (each with distinct phonological function)
 * - Vowel harmony: ATR ±ATR contrast
 * - Open syllable structure: (C)V — codas are extremely rare
 * - Nasalised vowels: ã, ẽ, ĩ, õ, ũ are phonemically distinct
 *
 * Strategy:
 * - Tone extraction: NFD decomposition (acute=H, grave=L, no mark=M)
 * - ATR class: +ATR vowels {i e o u} vs −ATR {ɛ ɔ ɪ ʊ} (normalised from surface)
 * - Nasal vowel: preserved as distinct nucleus
 * - Coda: near-empty; only nasal /n/ possible word-finally
 *
 * Scoring: vowel identity 35% + ATR harmony 15% + tone 50%
 * Rationale: In Yoruba oral poetry (oriki), tone is primary.
 */

import type { LineEndingUnit, RhymeNucleus } from './types';
import { toneDistance } from './scoring';

// ─── Tone extraction ──────────────────────────────────────────────────────────

function extractTone(token: string): string {
  const nfd = token.normalize('NFD');
  if (/\u0301/.test(nfd)) return 'H'; // acute accent
  if (/\u0300/.test(nfd)) return 'L'; // grave accent
  return 'M';                           // unmarked = mid
}

// ─── ATR normalisation ────────────────────────────────────────────────────────

// Map surface characters to ATR-neutral IPA-approximate
const ATR_MINUS_MAP: Record<string, string> = {
  'ɛ': 'e_atr-', 'ε': 'e_atr-',
  'ɔ': 'o_atr-', 'ο': 'o_atr-',
  'ɪ': 'i_atr-',
  'ʊ': 'u_atr-',
  'e\u0300': 'e_atr-', // context-dependent; surface heuristic only
};

// Nasal vowels: preserve distinctness
const NASAL_VOWELS = /[ãẽĩõũ]/u;

const YO_VOWELS = /[aeiouáàéèíìóòúùẹọạɛɔɪʊãẽĩõũ]+/giu;

function extractVowelNucleus(token: string): { vowels: string; atrClass: 'plus' | 'minus' | 'unknown' } {
  const lower   = token.toLowerCase().normalize('NFC');
  const matches = [...lower.matchAll(YO_VOWELS)];
  const last    = matches.at(-1)?.[0] ?? lower.slice(-2);

  // Determine ATR class from nucleus
  const hasMinus = Object.keys(ATR_MINUS_MAP).some(k => lower.includes(k));
  const atrClass = hasMinus ? 'minus' : 'plus';

  return { vowels: last, atrClass };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface YRBNucleus extends RhymeNucleus {
  atrClass: 'plus' | 'minus' | 'unknown';
}

export function extractNucleusYRB(unit: LineEndingUnit): YRBNucleus {
  const { surface } = unit;
  if (!surface) {
    return { vowels: '', coda: '', tone: '', onset: '', moraCount: 1, atrClass: 'unknown' };
  }

  const tone              = extractTone(surface);
  const { vowels, atrClass } = extractVowelNucleus(surface);

  // Coda: Yoruba near-exclusively (C)V — only final /n/ possible
  const lower = surface.toLowerCase().normalize('NFC');
  const lastVowelMatch = [...lower.matchAll(YO_VOWELS)].at(-1);
  const coda = lastVowelMatch
    ? lower.slice((lastVowelMatch.index ?? 0) + lastVowelMatch[0].length).replace(/[^n]/g, '')
    : '';

  return {
    vowels,
    coda,
    tone,
    onset:     '',
    moraCount: 1,
    atrClass,
  };
}

export function scoreYRB(a: YRBNucleus, b: YRBNucleus): number {
  // Vowel identity (NFC-stripped, tone-diacritic removed)
  const stripTone = (s: string) => s.normalize('NFD').replace(/[\u0300\u0301]/g, '').normalize('NFC');
  const vA = stripTone(a.vowels);
  const vB = stripTone(b.vowels);
  const vowSim = vA === vB ? 1 : (vA[0] === vB[0] ? 0.5 : 0);

  // ATR harmony bonus
  const atrSim = (a.atrClass !== 'unknown' && b.atrClass !== 'unknown')
    ? (a.atrClass === b.atrClass ? 1 : 0)
    : 0.5;

  // Tone weight: 50% — primary in Yoruba poetics
  const toneSim = toneDistance(a.tone || undefined, b.tone || undefined);

  return 0.35 * vowSim + 0.15 * atrSim + 0.50 * toneSim;
}

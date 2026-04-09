/**
 * Rhyme Engine v2 — Scoring utilities
 */

import type { RhymeCategory, RhymeNucleus } from './types';

// ─── Phoneme Edit Distance ──────────────────────────────────────────────────

export function phonemeEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a || !b) return 1;

  const la = a.length;
  const lb = b.length;

  // Build dp table with explicit initialization
  const dp: number[][] = [];
  for (let i = 0; i <= la; i++) {
    dp[i] = [];
    for (let j = 0; j <= lb; j++) {
      if (i === 0) { dp[i][j] = j; }
      else if (j === 0) { dp[i][j] = i; }
      else { dp[i][j] = 0; }
    }
  }

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const ai = a[i - 1] ?? '';
      const bj = b[j - 1] ?? '';
      if (ai === bj) {
        dp[i][j] = dp[i - 1]?.[j - 1] ?? 0;
      } else {
        const del  = dp[i - 1]?.[j]     ?? Infinity;
        const ins  = dp[i]?.[j - 1]     ?? Infinity;
        const sub  = dp[i - 1]?.[j - 1] ?? Infinity;
        dp[i][j] = 1 + Math.min(del, ins, sub);
      }
    }
  }

  const result = dp[la]?.[lb] ?? 0;
  return result / Math.max(la, lb);
}

// ─── KWA tonal scoring ──────────────────────────────────────────────────────

export function scoreKWANormalized(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowelSim = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim  = 1 - phonemeEditDistance(a.coda, b.coda);
  const toneMatch = (a.tone && b.tone) ? (a.tone === b.tone ? 1 : 0) : 0.5;
  return 0.4 * vowelSim + 0.2 * codaSim + 0.4 * toneMatch;
}

// ─── CRV mora-weighted scoring ──────────────────────────────────────────────

export function scoreCRV(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowelSim   = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim    = 1 - phonemeEditDistance(a.coda, b.coda);
  const moraBonus  = (a.moraCount === 2 && b.moraCount === 2) ? 1.3 : 1.0;
  const raw        = 0.55 * vowelSim * moraBonus + 0.45 * codaSim;
  return Math.min(raw, 1);
}

// ─── Category threshold mapping ─────────────────────────────────────────────

export function categorize(score: number): RhymeCategory {
  if (score >= 0.92) return 'perfect';
  if (score >= 0.80) return 'rich';
  if (score >= 0.60) return 'sufficient';
  if (score >= 0.35) return 'weak';
  return 'none';
}

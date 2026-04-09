/**
 * Rhyme Engine v2 — Scoring utilities
 */

import type { RhymeCategory, RhymeNucleus } from './types';

// ─── Phoneme Edit Distance ──────────────────────────────────────────────────
//
// Use a flat Int32Array to avoid all dp[i][j] optional-chain issues.
// idx(i, j) = i * (lb+1) + j

export function phonemeEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return 1;

  const la = a.length;
  const lb = b.length;
  const cols = lb + 1;
  const dp = new Int32Array((la + 1) * cols);

  // Base row
  for (let j = 0; j <= lb; j++) dp[j] = j;
  // Base column
  for (let i = 1; i <= la; i++) dp[i * cols] = i;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = dp[(i - 1) * cols + j] + 1;
      const ins = dp[i * cols + (j - 1)] + 1;
      const sub = dp[(i - 1) * cols + (j - 1)] + cost;
      dp[i * cols + j] = Math.min(del, ins, sub);
    }
  }

  return dp[la * cols + lb] / Math.max(la, lb);
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

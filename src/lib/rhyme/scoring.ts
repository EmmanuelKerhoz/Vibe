/**
 * Rhyme Engine v2 — Scoring utilities
 */

import type { RhymeCategory, RhymeNucleus } from './types';

// ─── Phoneme Edit Distance (PED) ─────────────────────────────────────────────

/**
 * Levenshtein distance normalized to [0, 1].
 * 0 = identical, 1 = completely different.
 */
export function phonemeEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a || !b) return 1;

  const la = a.length;
  const lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[la][lb] / Math.max(la, lb);
}

// ─── KWA tonal scoring ───────────────────────────────────────────────────────

/**
 * KWA: vowel nucleus + binary HL tone match.
 * Tone weight: 40% of total score.
 */
export function scoreKWANormalized(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowelSim = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim  = 1 - phonemeEditDistance(a.coda, b.coda);
  const toneMatch = (a.tone && b.tone) ? (a.tone === b.tone ? 1 : 0) : 0.5;

  // vowel 40% + coda 20% + tone 40%
  return 0.4 * vowelSim + 0.2 * codaSim + 0.4 * toneMatch;
}

// ─── CRV mora-weighted scoring ───────────────────────────────────────────────

/**
 * CRV: mora-weighted vowel similarity + coda.
 * Long vowels (2 morae) get a 1.3× bonus on vowel match.
 */
export function scoreCRV(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowelSim   = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim    = 1 - phonemeEditDistance(a.coda, b.coda);
  const moraBonus  = (a.moraCount === 2 && b.moraCount === 2) ? 1.3 : 1.0;
  const raw        = 0.55 * vowelSim * moraBonus + 0.45 * codaSim;
  return Math.min(raw, 1);
}

// ─── Category threshold mapping ──────────────────────────────────────────────

export function categorize(score: number): RhymeCategory {
  if (score >= 0.92) return 'perfect';
  if (score >= 0.80) return 'rich';
  if (score >= 0.60) return 'sufficient';
  if (score >= 0.35) return 'weak';
  return 'none';
}

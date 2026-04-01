/**
 * Shared scoring utilities for phonological comparison.
 * docs_fusion_optimal.md §5 — Mesures de similarité.
 */

import type { RhymeNucleus, MatchingWeights } from '../core/types';

// ─── §5.1 Exact match ──────────────────────────────────────────────────────────

export function exactMatch(rn1: RhymeNucleus, rn2: RhymeNucleus): number {
  return rn1.raw === rn2.raw ? 1.0 : 0.0;
}

// ─── §5.2 Phoneme Edit Distance (PED) ──────────────────────────────────────────

/** Levenshtein distance on IPA phoneme sequences (space-optimised two-row). */
function levenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  let curr: number[] = new Array(n + 1).fill(0) as number[];
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j]! + 1,
        curr[j - 1]! + 1,
        prev[j - 1]! + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
}

/** Split IPA string into individual phoneme segments (simplified). */
function segmentIPA(ipa: string): string[] {
  // Simple split on individual characters; a real implementation would
  // handle affricates, diacritics clusters, etc.
  return [...ipa].filter(c => c.trim().length > 0);
}

export function phonemeEditDistance(rn1: RhymeNucleus, rn2: RhymeNucleus): number {
  const a = segmentIPA(rn1.raw);
  const b = segmentIPA(rn2.raw);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── §5.3 Feature-weighted scoring (per-family) ────────────────────────────────

/**
 * Compute a weighted score using per-family matching weights.
 * This is the primary method used by most strategies.
 */
export function featureWeightedScore(
  rn1: RhymeNucleus,
  rn2: RhymeNucleus,
  weights: MatchingWeights,
): number {
  let score = 0;
  let totalWeight = 0;

  // Nucleus match
  if (weights.nucleus > 0) {
    totalWeight += weights.nucleus;
    if (rn1.nucleus === rn2.nucleus) {
      score += weights.nucleus;
    }
  }

  // Tone match
  if (weights.tone > 0) {
    totalWeight += weights.tone;
    if (rn1.toneClass === rn2.toneClass) {
      score += weights.tone;
    }
  }

  // Weight match (CRV/Hausa)
  if (weights.weight > 0) {
    totalWeight += weights.weight;
    if (rn1.weight === rn2.weight) {
      score += weights.weight;
    }
  }

  // Coda class match
  if (weights.codaClass > 0) {
    totalWeight += weights.codaClass;
    if (rn1.codaClass === rn2.codaClass) {
      score += weights.codaClass;
    }
  }

  return totalWeight > 0 ? score / totalWeight : 0;
}

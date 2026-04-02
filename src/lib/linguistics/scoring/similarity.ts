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

/**
 * Split an IPA string into individual phoneme tokens.
 *
 * Priority order (longest match first):
 * 1. Affricates: tʃ dʒ ts dz tɕ dʑ
 * 2. Labio-velars (KWA/BNT): kp gb ŋm
 * 3. Base symbol + combining diacritics (U+0300–U+036F) + length mark ː
 * 4. Single non-whitespace IPA character
 *
 * This replaces the naive character-by-character split that incorrectly
 * counted each half of an affricate or labio-velar as a separate phoneme.
 */
export function segmentIPA(ipa: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const chars = [...ipa]; // Unicode-safe iteration
  const len = chars.length;

  // Pre-built affricate / labio-velar multi-char patterns (descending length)
  const multichar = [
    'tʃ', 'dʒ', 'tɕ', 'dʑ', 'ts', 'dz', 'kp', 'gb', 'ŋm',
  ];

  while (i < len) {
    const ch = chars[i]!;

    // Skip whitespace
    if (ch.trim() === '') { i++; continue; }

    // Try multi-char tokens
    let matched = false;
    for (const mc of multichar) {
      const mcChars = [...mc];
      if (chars.slice(i, i + mcChars.length).join('') === mc) {
        tokens.push(mc);
        i += mcChars.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Base char + optional combining diacritics + optional length mark
    let token = ch;
    i++;
    while (i < len) {
      const next = chars[i]!;
      if (/[\u0300-\u036f\u02b0-\u02ffː]/.test(next)) {
        token += next;
        i++;
      } else {
        break;
      }
    }
    tokens.push(token);
  }

  return tokens;
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
 *
 * Nucleus comparison strategy:
 * - Exact string match → 1.0 (no change, no regression for orthographic stubs).
 * - Partial phonemic overlap: uses phonemeEditDistance on the nucleus strings
 *   when they differ. This is a no-op today (orthographic stubs produce full
 *   match or full miss), but once real G2P is wired it will produce graduated
 *   scores for near-miss nuclei (e.g. IPA /ɛ/ vs /e/ → ~0.5 rather than 0).
 *
 * This keeps the scoring pipeline future-proof without breaking current behaviour.
 */
export function featureWeightedScore(
  rn1: RhymeNucleus,
  rn2: RhymeNucleus,
  weights: MatchingWeights,
): number {
  let score = 0;
  let totalWeight = 0;

  // Nucleus match — graduated via PED when nuclei differ
  if (weights.nucleus > 0) {
    totalWeight += weights.nucleus;
    if (rn1.nucleus === rn2.nucleus) {
      score += weights.nucleus;
    } else if (rn1.nucleus && rn2.nucleus) {
      // Use phonemeEditDistance on nucleus strings only (not full raw).
      // Construct minimal RhymeNucleus shells for the PED helper.
      const pedScore = phonemeEditDistance(
        { ...rn1, raw: rn1.nucleus },
        { ...rn2, raw: rn2.nucleus },
      );
      score += weights.nucleus * pedScore;
    }
    // If either nucleus is empty, contribute 0 (handled by fall-through).
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

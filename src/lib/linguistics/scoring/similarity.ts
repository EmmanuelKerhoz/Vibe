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
 * 3. Base symbol + combining diacritics (U+0300–U+036F) +
 *    superscript modifiers (U+02B0–U+02C8 strict) + length mark ː
 *    Note: range is intentionally capped at U+02C8 (modifier letter
 *    vertical line / primary stress mark) to exclude U+02BB (ʻ okina /
 *    glottal stop in Hawaiian and Semitic transcription) and other
 *    modified-letter codepoints above U+02C8 that are standalone phonemes,
 *    not diacritics decorating a base symbol.
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

    // Base char + optional combining diacritics + optional superscript
    // modifiers (U+02B0–U+02C8 only) + optional length mark ː
    let token = ch;
    i++;
    while (i < len) {
      const next = chars[i]!;
      if (/[\u0300-\u036f\u02b0-\u02c8ː]/.test(next)) {
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
 * ## Nucleus comparison strategy
 * - Exact string match → 1.0 (no change, no regression for orthographic stubs).
 * - Partial phonemic overlap: uses phonemeEditDistance on the nucleus strings
 *   when they differ. This is a no-op today (orthographic stubs produce full
 *   match or full miss), but once real G2P is wired it will produce graduated
 *   scores for near-miss nuclei (e.g. IPA /ɛ/ vs /e/ → ~0.5 rather than 0).
 *
 * ## Threshold contract
 * `weights.threshold` is **not** applied automatically by this function.
 * It is stored in `MatchingWeights` as a declaration of the family's intent,
 * but the decision to gate on it belongs to the caller (UI layer, comparison
 * orchestrator, or test harness). This avoids silent 0-returns that break
 * graduated scoring pipelines.
 *
 * To apply the threshold, use the `applyThreshold` parameter:
 * ```ts
 * featureWeightedScore(rn1, rn2, weights, true)
 * // → returns 0 if score < weights.threshold, else the raw score
 * ```
 *
 * Default: `applyThreshold = false` — preserves backward compatibility.
 *
 * @param rn1 - First rhyme nucleus
 * @param rn2 - Second rhyme nucleus
 * @param weights - Per-family weights including optional threshold
 * @param applyThreshold - If true, returns 0 when score < weights.threshold
 */
export function featureWeightedScore(
  rn1: RhymeNucleus,
  rn2: RhymeNucleus,
  weights: MatchingWeights,
  applyThreshold = false,
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

  const rawScore = totalWeight > 0 ? score / totalWeight : 0;

  if (applyThreshold && rawScore < weights.threshold) {
    return 0;
  }

  return rawScore;
}

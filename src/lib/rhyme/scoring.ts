/**
 * Rhyme Engine v2 — Scoring utilities
 */

import type { RhymeCategory, RhymeNucleus } from './types';

// ─── Phoneme Edit Distance ────────────────────────────────────────────────────────
//
// Use a flat Int32Array to avoid all dp[i][j] optional-chain issues.
// idx(i, j) = i * (lb+1) + j
// Int32Array[n] is `number | undefined` under noUncheckedIndexedAccess —
// use non-null assertion (!) which is safe here because all indices are
// computed within bounds.

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
      const del = dp[(i - 1) * cols + j]! + 1;
      const ins = dp[i * cols + (j - 1)]! + 1;
      const sub = dp[(i - 1) * cols + (j - 1)]! + cost;
      dp[i * cols + j] = Math.min(del, ins, sub);
    }
  }

  return dp[la * cols + lb]! / Math.max(la, lb);
}

// ─── KWA tonal scoring ──────────────────────────────────────────────────────────────

/**
 * Tone distance table for 3-level tonal systems (H / M / L).
 *
 * Rationale:
 * - H ≠ L : maximal distance (adjacent levels skipped)  → 0.0
 * - H ≠ M : one step apart                              → 0.5
 * - M ≠ L : one step apart                              → 0.5
 * - any = any                                            → 1.0
 * - one tone absent (undefined)                          → 0.4
 *   (uncertainty — lower than a confirmed partial match,
 *    higher than a confirmed full mismatch)
 *
 * Exported for unit tests.
 */
export function toneDistance(a: string | undefined, b: string | undefined): number {
  if (!a || !b) return 0.4;       // at least one tone undetected — uncertain
  if (a === b)  return 1.0;       // exact match (case-sensitive fast path)

  const aU = a.toUpperCase();
  const bU = b.toUpperCase();

  if (aU === bU) return 1.0;      // case-insensitive match ('m' vs 'M')

  // Adjacent steps: H↔M or M↔L
  if ((aU === 'H' && bU === 'M') || (aU === 'M' && bU === 'H')) return 0.5;
  if ((aU === 'M' && bU === 'L') || (aU === 'L' && bU === 'M')) return 0.5;

  // Maximum distance: H↔L
  if ((aU === 'H' && bU === 'L') || (aU === 'L' && bU === 'H')) return 0.0;

  // Falling tone (F): partially compatible with both H and L
  if (aU === 'F' || bU === 'F') return 0.5;

  // Numeric tones or unrecognised labels: treat as binary
  return 0.0;
}

export function scoreKWANormalized(a: RhymeNucleus, b: RhymeNucleus): number {
  const vowelSim = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim  = 1 - phonemeEditDistance(a.coda,   b.coda);
  const toneSim  = toneDistance(a.tone, b.tone);
  return 0.4 * vowelSim + 0.2 * codaSim + 0.4 * toneSim;
}

// ─── CRV mora-weighted scoring ────────────────────────────────────────────────────────────

/**
 * CRV score.
 * For HA (Haoussa): tonal class contributes 20% via toneDistance.
 * Other CRV langs: atonal — vowel 55% + coda 45% + mora bonus.
 *
 * @param lang  Optional LangCode or string — 'ha' activates tonal path.
 */
export function scoreCRV(
  a: RhymeNucleus,
  b: RhymeNucleus,
  lang = ''
): number {
  const vowelSim  = 1 - phonemeEditDistance(a.vowels, b.vowels);
  const codaSim   = 1 - phonemeEditDistance(a.coda, b.coda);
  const moraBonus = (a.moraCount === 2 && b.moraCount === 2) ? 1.3 : 1.0;

  if (lang === 'ha') {
    // Haoussa: tone 20%, vowel 50%, coda 30% — mora bonus still applies on vowel
    const toneSim = toneDistance(a.tone, b.tone);
    const raw = 0.50 * vowelSim * moraBonus + 0.30 * codaSim + 0.20 * toneSim;
    return Math.min(raw, 1);
  }

  const raw = 0.55 * vowelSim * moraBonus + 0.45 * codaSim;
  return Math.min(raw, 1);
}

// ─── Category threshold mapping ─────────────────────────────────────────────────────────────────

export function categorize(score: number): RhymeCategory {
  if (score >= 0.92) return 'perfect';
  if (score >= 0.80) return 'rich';
  if (score >= 0.60) return 'sufficient';
  if (score >= 0.35) return 'weak';
  return 'none';
}

// ---------------------------------------------------------------------------
// musicalPromptCompleteness.ts
// ---------------------------------------------------------------------------
// Pure helper that scores how "complete" a generated musical prompt is by
// counting how many of the canonical sections (style, mood, vocals,
// instrumentation, structure) it explicitly references.
//
// Extracted from MusicalInsightsBar so the scoring logic can be unit-tested
// in isolation and reused without pulling in the toolbar component.
// ---------------------------------------------------------------------------

/** Regex checks driving the completeness score. Order is informational only. */
const COMPLETENESS_CHECKS: readonly RegExp[] = [
  /style/i,
  /mood|vibe/i,
  /vocal|voice/i,
  /instrument|bpm|tempo/i,
  /structure|verse|chorus/i,
];

/** Total number of sections used to compute the percentage. */
export const COMPLETENESS_TOTAL = COMPLETENESS_CHECKS.length;

export interface CompletenessResult {
  /** Number of sections detected in the prompt (0..total). */
  readonly filled: number;
  /** Maximum possible value of `filled` — kept for UI display stability. */
  readonly total: number;
  /** Rounded percentage in [0, 100]. */
  readonly pct: number;
}

/**
 * Compute the prompt completeness score.
 *
 * - Returns `{ filled: 0, total, pct: 0 }` for `undefined`, `null`, empty or
 *   whitespace-only inputs (so the UI can render a stable progress bar).
 * - The check is intentionally case-insensitive and tolerant — it only looks
 *   at whether the prompt mentions each canonical section.
 */
export function computeCompleteness(prompt: string | null | undefined): CompletenessResult {
  if (!prompt || prompt.trim().length === 0) {
    return { filled: 0, total: COMPLETENESS_TOTAL, pct: 0 };
  }
  const filled = COMPLETENESS_CHECKS.filter((re) => re.test(prompt)).length;
  return {
    filled,
    total: COMPLETENESS_TOTAL,
    pct: Math.round((filled / COMPLETENESS_TOTAL) * 100),
  };
}

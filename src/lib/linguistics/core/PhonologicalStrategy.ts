/**
 * PhonologicalStrategy — abstract base for all ALGO-XXX family strategies.
 *
 * Implements the 5-step pipeline from docs_fusion_optimal.md §1 / Annexe 2 §1.
 * Each family overrides the specialised steps while inheriting the canonical flow.
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';
import type {
  MatchingWeights,
  RhymeNucleus,
  RhymePairResult,
  RhymeResult,
  RhymeType,
  Syllable,
  SimilarityMethod,
} from './types';

export abstract class PhonologicalStrategy {
  abstract readonly familyId: AlgoFamily;
  abstract readonly defaultWeights: MatchingWeights;

  // ─── Step 1: Normalisation & tokenisation ──────────────────────────────
  abstract normalize(text: string, lang: string): string;

  // ─── Step 2: G2P — Grapheme to Phoneme (IPA) ──────────────────────────
  abstract g2p(normalized: string, lang: string): string;

  // ─── Step 3: Syllabification ─────────────────────────────────────────────
  abstract syllabify(ipa: string, lang: string): Syllable[];

  // ─── Step 4: Rhyme Nucleus extraction ────────────────────────────────────
  abstract extractRN(syllables: Syllable[], lang: string): RhymeNucleus;

  // ─── Step 5: Scoring ────────────────────────────────────────────────────
  abstract score(
    rn1: RhymeNucleus,
    rn2: RhymeNucleus,
    weights?: Partial<MatchingWeights>,
  ): number;

  // ─── Canonical pipeline (final — not overridden) ─────────────────────────

  /**
   * Run the full 5-step pipeline on a single text input.
   *
   * Note: `score` and `rhymeType` are NOT set here — a single-verse analysis
   * has no comparison partner, so setting them would produce a misleading
   * hard-coded value. Use `compare()` to obtain a scored `RhymePairResult`.
   *
   * `lowResourceFallback` is propagated from the RhymeNucleus produced by
   * extractRN() — strategies that detect low-resource conditions (e.g. raw Han
   * characters, unsupported scripts) set this flag on the nucleus, and it must
   * surface here so UI consumers can downgrade confidence indicators.
   */
  analyze(text: string, lang: string): RhymeResult {
    const normalized = this.normalize(text, lang);
    const ipa = this.g2p(normalized, lang);
    const syllables = this.syllabify(ipa, lang);
    const rn = this.extractRN(syllables, lang);
    return {
      algoId: this.familyId,
      lang,
      input: text,
      ipa,
      syllables,
      rhymeNucleus: rn,
      score: undefined,
      rhymeType: undefined,
      similarityMethod: 'feature',
      // `lowResourceFallback` is declared optional on RhymeNucleus — access
      // directly without cast. Strategies that cannot produce phonological
      // analysis (orthographic stubs, unsupported scripts) set this to true;
      // default to false for phonologically complete strategies.
      lowResourceFallback: rn.lowResourceFallback ?? false,
    };
  }

  /** Compare two texts and return a scored rhyme pair result. */
  compare(
    text1: string,
    text2: string,
    lang: string,
    options?: { method?: SimilarityMethod; threshold?: number },
  ): RhymePairResult {
    const a = this.analyze(text1, lang);
    const b = this.analyze(text2, lang);
    const pairScore = this.score(a.rhymeNucleus, b.rhymeNucleus);
    const threshold = options?.threshold ?? this.defaultWeights.threshold;
    return {
      familyId: this.familyId,
      lang,
      text1,
      text2,
      rn1: a.rhymeNucleus,
      rn2: b.rhymeNucleus,
      score: pairScore,
      rhymeType: categorizeScore(pairScore, threshold),
      method: options?.method ?? 'feature',
    };
  }
}

// ─── Shared categorisation (§6 — Typologie des rimes) ──────────────────────────

/**
 * Classify a raw similarity score into a rhyme type.
 *
 * Guard order (most restrictive first):
 * 1. Absolute floor: scores below 0.40 are always 'none', regardless of the
 *    per-family threshold. This prevents a low custom threshold (e.g. 0.30)
 *    from promoting a genuinely weak phonemic match to 'weak'.
 * 2. Per-family threshold: scores below the configured threshold are 'none'.
 * 3. Typed bands: rich ≥ 0.95, sufficient ≥ 0.85, assonance ≥ 0.60, else 'weak'.
 *
 * ## Band reachability
 * With the default threshold (0.75), the 'weak' band [0.60–0.75) is
 * inaccessible: guard #2 returns 'none' for any score < 0.75 before reaching
 * the 'weak' check. The 'weak' band is only reachable when the caller passes
 * a threshold < 0.60 (e.g. the ALGO-ROBUST fallback uses threshold=0.50).
 * This is intentional — families with a high threshold signal that they
 * consider the 0.60–0.75 range too ambiguous to label as a rhyme type.
 */
export function categorizeScore(rawScore: number, threshold = 0.75): RhymeType {
  if (rawScore < 0.40 || rawScore < threshold) return 'none';
  if (rawScore >= 0.95) return 'rich';
  if (rawScore >= 0.85) return 'sufficient';
  if (rawScore >= 0.60) return 'assonance';
  return 'weak';
}

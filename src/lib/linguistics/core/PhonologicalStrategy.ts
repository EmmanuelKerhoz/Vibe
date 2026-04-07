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
   * `nucleus` is sourced from `rn.nucleus` (the RhymeNucleus produced by
   * extractRN) so that onset-glides (e.g. ɥ in French nuit/fuite) are
   * included in the composite nucleus exposed on RhymeResult.
   * Previously this used `stressedSyl.nucleus` which excluded the glide,
   * causing `analyze('nuit','fr').nucleus` to return 'i' instead of 'ɥi'.
   *
   * `lowResourceFallback` is propagated from the RhymeNucleus.
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
      // Use rn.nucleus (includes onset-glide composite) rather than the raw
      // syllable nucleus, so that RhymeResult.nucleus matches what consumers
      // expect as the phonologically meaningful rhyming unit.
      nucleus: rn.nucleus,
      rhymeNucleus: rn,
      score: undefined,
      rhymeType: undefined,
      similarityMethod: 'feature',
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
 * 1. Absolute floor: scores below 0.40 are always 'none'.
 * 2. Per-family threshold: scores below the configured threshold are 'none'.
 * 3. Typed bands: rich ≥ 0.95, sufficient ≥ 0.85, assonance ≥ 0.60, else 'weak'.
 */
export function categorizeScore(rawScore: number, threshold = 0.75): RhymeType {
  if (rawScore < 0.40 || rawScore < threshold) return 'none';
  if (rawScore >= 0.95) return 'rich';
  if (rawScore >= 0.85) return 'sufficient';
  if (rawScore >= 0.60) return 'assonance';
  return 'weak';
}

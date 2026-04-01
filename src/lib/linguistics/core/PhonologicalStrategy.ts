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

  // ─── Step 1: Normalisation & tokenisation ──────────────────────────────────
  abstract normalize(text: string, lang: string): string;

  // ─── Step 2: G2P — Grapheme to Phoneme (IPA) ──────────────────────────────
  abstract g2p(normalized: string, lang: string): string;

  // ─── Step 3: Syllabification ───────────────────────────────────────────────
  abstract syllabify(ipa: string, lang: string): Syllable[];

  // ─── Step 4: Rhyme Nucleus extraction ──────────────────────────────────────
  abstract extractRN(syllables: Syllable[], lang: string): RhymeNucleus;

  // ─── Step 5: Scoring ───────────────────────────────────────────────────────
  abstract score(
    rn1: RhymeNucleus,
    rn2: RhymeNucleus,
    weights?: Partial<MatchingWeights>,
  ): number;

  // ─── Canonical pipeline (final — not overridden) ───────────────────────────

  /** Run the full 5-step pipeline on a single text input. */
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
      score: 1.0,
      rhymeType: 'rich',
      similarityMethod: 'feature',
      lowResourceFallback: false,
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
    const s = this.score(a.rhymeNucleus, b.rhymeNucleus);
    const threshold = options?.threshold ?? this.defaultWeights.threshold;
    return {
      familyId: this.familyId,
      lang,
      text1,
      text2,
      rn1: a.rhymeNucleus,
      rn2: b.rhymeNucleus,
      score: s,
      rhymeType: categorizeScore(s, threshold),
      method: options?.method ?? 'feature',
    };
  }
}

// ─── Shared categorisation (§6 — Typologie des rimes) ──────────────────────────

export function categorizeScore(score: number, threshold = 0.75): RhymeType {
  if (score < threshold && score < 0.40) return 'none';
  if (score >= 0.95) return 'rich';
  if (score >= 0.85) return 'sufficient';
  if (score >= 0.60) return 'assonance';
  if (score >= threshold) return 'weak';
  return 'none';
}

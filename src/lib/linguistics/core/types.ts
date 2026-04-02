/**
 * Core types for the polymorphic phonological engine.
 * Based on docs/docs_fusion_optimal.md — Partie A §4 (modèle phonologique commun).
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';

// ─── Syllable model (§4.1) ──────────────────────────────────────────────────────────

/** Tone class normalised to binary HIGH/LOW for cross-family comparison. */
export type ToneClass = 'H' | 'L' | 'HL' | 'LH' | 'M' | 'MH' | 'ML' | null;

/** Weight marker for moraic languages (CRV/Hausa). */
export type SyllableWeight = 'light' | 'heavy' | null;

/** Syllable model: onset + nucleus + coda + optional tone/weight. */
export interface Syllable {
  onset: string;
  nucleus: string;
  coda: string;
  tone: ToneClass;
  weight: SyllableWeight;
  stressed: boolean;
  /** Original CV/CVC template string for debug. */
  template?: string;
}

// ─── Rhyme Nucleus (§4.2) ──────────────────────────────────────────────────────

/** Rhyme Nucleus extracted from the last stressed syllable through end of verse. */
export interface RhymeNucleus {
  /** IPA segments of the nucleus portion. */
  nucleus: string;
  /** Coda of the stressed syllable. */
  coda: string;
  /** Tone class (for tonal families). */
  toneClass: ToneClass;
  /** Syllable weight (for CRV/Hausa). */
  weight: SyllableWeight;
  /** Coda class (nasal/liquid/obstruent) for CRV weighted matching. */
  codaClass: 'nasal' | 'liquid' | 'obstruent' | null;
  /** Full trailing IPA string (nucleus + coda + following syllables). */
  raw: string;
  /**
   * Set to true when the strategy cannot produce a reliable phonological
   * analysis (e.g. unsupported script, no G2P dictionary, low-resource lang).
   * Consumers should downgrade confidence indicators when this is true.
   */
  lowResourceFallback?: boolean;
}

// ─── Scoring (§5–6) ───────────────────────────────────────────────────────────

export type SimilarityMethod = 'exact' | 'edit' | 'feature' | 'embedding';

export type RhymeType = 'rich' | 'sufficient' | 'assonance' | 'weak' | 'none';

/**
 * Unified output structure (§7).
 *
 * `score` and `rhymeType` are intentionally optional: a single-verse analysis
 * has no comparison partner, so no score is computed. Use `RhymePairResult`
 * (returned by `compare()`) for a scored, typed rhyme result.
 */
export interface RhymeResult {
  algoId: AlgoFamily;
  lang: string;
  input: string;
  ipa: string;
  syllables: Syllable[];
  rhymeNucleus: RhymeNucleus;
  /** Undefined for single-verse analysis; defined only via compare(). */
  score: number | undefined;
  /** Undefined for single-verse analysis; defined only via compare(). */
  rhymeType: RhymeType | undefined;
  similarityMethod: SimilarityMethod;
  lowResourceFallback: boolean;
  debug?: Record<string, unknown>;
}

/** Pair comparison output returned by the scoring pipeline. */
export interface RhymePairResult {
  familyId: AlgoFamily;
  lang: string;
  text1: string;
  text2: string;
  rn1: RhymeNucleus;
  rn2: RhymeNucleus;
  score: number;
  rhymeType: RhymeType;
  method: SimilarityMethod;
  debug?: Record<string, unknown>;
}

// ─── Rhyme schema: target vs detected (§ store integration) ───────────────────────

/**
 * targetSchema — user's intended rhyme pattern (e.g. "AABB").
 * Tracked in the UNDO/REDO history because it is a user-driven mutation.
 */
export type TargetSchema = string;

/**
 * detectedSchema — phonologically computed rhyme pattern from line analysis.
 * Pure derived state: MUST NOT be stored in history stack.
 */
export type DetectedSchema = string;

// ─── Matching weights (per-family configurable) ─────────────────────────────────

export interface MatchingWeights {
  nucleus: number;
  tone: number;
  weight: number;
  codaClass: number;
  threshold: number;
}

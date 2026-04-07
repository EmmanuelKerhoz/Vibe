/**
 * Core types for the polymorphic phonological engine.
 * Based on docs/docs_fusion_optimal.md — Partie A §4 (modèle phonologique commun).
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';

// ─── Syllable model (§4.1) ───────────────────────────────────────────────────────

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

// ─── Rhyme Nucleus (§4.2) ────────────────────────────────────────────

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

// ─── Scoring (§5–6) ───────────────────────────────────────────────────

export type SimilarityMethod = 'exact' | 'edit' | 'feature' | 'embedding';

export type RhymeType = 'rich' | 'sufficient' | 'assonance' | 'weak' | 'none';

/**
 * Unified output structure (§7).
 */
export interface RhymeResult {
  algoId: AlgoFamily;
  lang: string;
  input: string;
  ipa: string;
  syllables: Syllable[];
  /**
   * Raw IPA nucleus of the stressed syllable, before any language-specific
   * mapping. E.g. 'ɑ̃' for French nasal words, as opposed to
   * `rhymeNucleus.nucleus` which may be mapped to an orthographic category.
   */
  nucleus: string;
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

// ─── Rhyme schema ──────────────────────────────────────────────────────────

/**
 * targetSchema — user’s intended rhyme pattern (e.g. "AABB").
 * Tracked in the UNDO/REDO history because it is a user-driven mutation.
 */
export type TargetSchema = string;

/**
 * DetectedSchema — phonologically computed rhyme pattern from lyric block analysis.
 * Produced by `detectRhymeScheme()` in rhyme/rhymeSchemeDetector.ts.
 * Pure derived state: MUST NOT be stored in history stack.
 */
export interface DetectedSchema {
  /** Letter-label pattern e.g. "AABB", "ABAB", "ABCA". */
  pattern: string;
  /** Mean similarity score among rhyming pairs (0–1). */
  confidence: number;
  /** Number of rhyme-bearing lines analysed. */
  lineCount: number;
}

// ─── LyricAnalysis ──────────────────────────────────────────────────────────

/**
 * Full analysis of a lyric block: per-line RhymeResult + detected schema + syllable counts.
 * Returned by `PhonologicalStrategy.analyzeLyric()`.
 */
export interface LyricAnalysis {
  /** Ordered per-line phonological results (one per rhyme-bearing line). */
  lines: RhymeResult[];
  /** Detected rhyme scheme for the block. */
  detectedSchema: DetectedSchema;
  /** Per-line syllable counts (parallel to `lines`). */
  syllableCounts: number[];
  /** True if any line fell back to low-resource path. */
  hasLowResourceLines: boolean;
}

// ─── Matching weights (per-family configurable) ───────────────────────────

export interface MatchingWeights {
  nucleus: number;
  tone: number;
  weight: number;
  codaClass: number;
  threshold: number;
}

/**
 * linguistics.types.ts — Shared type contract between the main thread and
 * the linguistics Web Worker.
 *
 * All messages exchanged via postMessage() are typed here.
 */

import type { RhymeResult, RhymePairResult, RhymeType, DetectedSchema } from '../linguistics/core/types';

// ─── Worker message protocol ────────────────────────────────────────────────

export interface LineInput {
  lineId: string;
  text: string;
  isMeta: boolean;
}

export interface SectionInput {
  sectionId: string;
  sectionName: string;
  lines: LineInput[];
  targetSchema?: string;
}

export interface AnalyzePayload {
  requestId: string;
  sections: SectionInput[];
  langCode: string;
}

export type WorkerRequest =
  | { type: 'analyze'; payload: AnalyzePayload };

export type WorkerResponse =
  | { type: 'result'; payload: AnalysisResult }
  | { type: 'error'; payload: { requestId: string; message: string } };

// ─── Result types ────────────────────────────────────────────────────────────

export interface LineInsight {
  lineId: string;
  text: string;
  syllableCount: number;
  charCount: number;
  wordCount: number;
  /** Rhyme label assigned by the schema detector (A, B, C, …). */
  rhymeLabel: string;
  /** Full phonological analysis result; null when strategy unavailable. */
  rhymeResult: RhymeResult | null;
}

export interface SectionInsight {
  sectionId: string;
  sectionName: string;
  /** User-defined target schema (e.g. "AABB"). */
  targetSchema: string;
  /**
   * Detected schema as a plain letter string (e.g. "ABAB").
   * Kept for legacy consumers that expect a bare string.
   */
  detectedSchema: string;
  /**
   * Detected schema as a typed object with confidence and line count.
   * Preferred over `detectedSchema` for new consumers.
   */
  detectedSchemaObj: DetectedSchema;
  lineInsights: LineInsight[];
  totalSyllables: number;
  totalWords: number;
  totalChars: number;
  avgSyllablesPerLine: number;
  avgWordsPerLine: number;
  /** Distribution of rhyme types across all scored pairs in this section. */
  rhymeTypes: Record<RhymeType, number>;
  /** Ratio of lines sharing a vowel nucleus (0–1). */
  assonanceDensity: number;
  /** Ratio of lines sharing initial consonant (0–1). */
  alliterationDensity: number;
}

export interface SimilarityPair {
  lineIdA: string;
  lineIdB: string;
  textA: string;
  textB: string;
  score: number;
  rhymeType: RhymeType;
  pairResult: RhymePairResult;
}

export interface AnalysisResult {
  requestId: string;
  sections: SectionInsight[];
  similarityPairs: SimilarityPair[];
  computeTimeMs: number;
}

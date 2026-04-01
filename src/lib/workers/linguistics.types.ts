/**
 * Typed message protocol for the linguistics Web Worker.
 * All heavy phonological computation runs off the main thread.
 *
 * Architecture invariant: results are pure derived state —
 * they MUST NOT enter the UNDO/REDO history stack.
 */

import type {
  RhymeResult,
  RhymePairResult,
  RhymeType,
} from '../linguistics/core/types';

// ─── Request (main → worker) ────────────────────────────────────────────────

export interface AnalyzePayload {
  /** Unique request id for deduplication. */
  requestId: string;
  sections: SectionPayload[];
  langCode: string;
}

export interface SectionPayload {
  sectionId: string;
  sectionName: string;
  lines: LinePayload[];
  targetSchema?: string;
}

export interface LinePayload {
  lineId: string;
  text: string;
  isMeta: boolean;
}

export type WorkerRequest =
  | { type: 'analyze'; payload: AnalyzePayload };

// ─── Response (worker → main) ────────────────────────────────────────────────

export interface LineInsight {
  lineId: string;
  text: string;
  syllableCount: number;
  charCount: number;
  wordCount: number;
  rhymeLabel: string;
  rhymeResult: RhymeResult | null;
}

export interface SectionInsight {
  sectionId: string;
  sectionName: string;
  targetSchema: string;
  detectedSchema: string;
  lineInsights: LineInsight[];
  totalSyllables: number;
  totalWords: number;
  totalChars: number;
  avgSyllablesPerLine: number;
  avgWordsPerLine: number;
  rhymeTypes: Record<RhymeType, number>;
  /** Assonance/alliteration density (0–1). */
  assonanceDensity: number;
  alliterationDensity: number;
}

export interface SimilarityPair {
  lineIdA: string;
  lineIdB: string;
  textA: string;
  textB: string;
  score: number;
  rhymeType: RhymeType;
  pairResult: RhymePairResult | null;
}

export interface AnalysisResult {
  requestId: string;
  sections: SectionInsight[];
  similarityPairs: SimilarityPair[];
  computeTimeMs: number;
}

export type WorkerResponse =
  | { type: 'result'; payload: AnalysisResult }
  | { type: 'error'; payload: { requestId: string; message: string } };

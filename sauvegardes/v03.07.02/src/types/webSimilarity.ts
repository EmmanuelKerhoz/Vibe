/**
 * Types for the Web Similarity Search Engine
 */

export type SearchProvider = 'ddg' | 'wikipedia';

export interface SearchTreeNode {
  title: string;
  snippet: string;
  url: string;
  source: SearchProvider;
}

export interface WebSimilarityCandidate {
  title: string;
  snippet: string;
  url: string;
  source: SearchProvider;
  /** Jaccard-based composite score 0–100 */
  score: number;
  /** Short excerpts from current lyrics that matched */
  matchedSegments: string[];
}

export type WebSimilarityStatus = 'idle' | 'running' | 'done' | 'error';

export interface WebSimilarityIndex {
  candidates: WebSimilarityCandidate[];
  status: WebSimilarityStatus;
  lastUpdated: number | null;
  error: string | null;
}

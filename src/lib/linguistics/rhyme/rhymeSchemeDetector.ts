/**
 * rhymeSchemeDetector.ts
 * Detects the rhyme scheme of a lyric block (AABB, ABAB, ABCABC, FREE, etc.)
 * by cross-scoring the RhymeNuclei of line-ending words.
 *
 * Does NOT reimplement scoring — delegates to featureWeightedScore via
 * the PhonologicalRegistry (same path as existing compare() calls).
 *
 * docs_fusion_optimal.md §4 (RN extraction) + §5 (similarity).
 */

import type { DetectedSchema } from '../core/types';
import { PhonologicalRegistry } from '../PhonologicalRegistry';
import { splitIntoRhymingLines, extractLineTail } from './lyricSegmenter';

/** Minimum similarity score to consider two lines as rhyming. */
const RHYME_THRESHOLD = 0.65;

/**
 * Detect the rhyme scheme of a lyric block.
 *
 * @param text  - Raw lyric text (may include section markers).
 * @param lang  - ISO 639-3 language code routed through PhonologicalRegistry.
 * @returns DetectedSchema with pattern string + confidence.
 */
export function detectRhymeScheme(
  text: string,
  lang: string,
): DetectedSchema {
  const lines = splitIntoRhymingLines(text);
  if (lines.length < 2) {
    return { pattern: 'FREE', confidence: 1.0, lineCount: lines.length };
  }

  const tails = lines.map(extractLineTail);
  const n = tails.length;

  // ── Similarity matrix ────────────────────────────────────────────────────
  // Build an n×n upper-triangle matrix of rhyme scores between line tails.
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0) as number[]);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      try {
        const result = PhonologicalRegistry.compare(tails[i]!, tails[j]!, lang);
        matrix[i]![j] = result.score;
      } catch {
        // Strategy not found for lang — use exact-string fallback
        matrix[i]![j] = tails[i] === tails[j] ? 1.0 : 0.0;
      }
    }
  }

  // ── Label assignment ─────────────────────────────────────────────────────
  // Assign letter labels (A, B, C…) greedily by first rhyme match ≥ threshold.
  const labels: string[] = new Array(n).fill('') as string[];
  let nextCode = 65; // 'A'

  for (let i = 0; i < n; i++) {
    if (labels[i] !== '') continue;
    labels[i] = String.fromCharCode(nextCode++);
    for (let j = i + 1; j < n; j++) {
      if (labels[j] === '' && (matrix[i]![j] ?? 0) >= RHYME_THRESHOLD) {
        labels[j] = labels[i]!;
      }
    }
  }

  // ── Pattern string ───────────────────────────────────────────────────────
  const pattern = labels.join('');

  // ── Confidence = mean similarity among rhyming pairs ────────────────────
  const rhymingPairs: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (labels[i] === labels[j]) {
        rhymingPairs.push(matrix[i]![j] ?? 0);
      }
    }
  }
  const confidence =
    rhymingPairs.length > 0
      ? rhymingPairs.reduce((s, v) => s + v, 0) / rhymingPairs.length
      : 0;

  return { pattern, confidence, lineCount: n };
}

/**
 * Normalise a raw pattern to a canonical scheme label.
 * AABB, ABAB, ABBA, ABCABC, AAAA → kept as-is.
 * Anything else → 'CUSTOM'.
 */
export function canonicalizeScheme(pattern: string): string {
  const canonical = new Set([
    'AABB', 'ABAB', 'ABBA', 'ABCABC', 'AAAA',
    'ABCB', 'AAAB', 'AABA', 'ABAC',
  ]);
  return canonical.has(pattern) ? pattern : 'CUSTOM';
}

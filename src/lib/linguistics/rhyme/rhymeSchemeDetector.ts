/**
 * rhymeSchemeDetector.ts
 * Detects the rhyme scheme of a lyric block (AABB, ABAB, ABCABC, FREE, etc.)
 * by cross-scoring the RhymeNuclei of line-ending words.
 *
 * Operates stanza-by-stanza: blank-line boundaries in the source text
 * delimit independent stanzas, each receiving its own label sequence
 * (A/B/C… restarted per stanza). The full-block summary in
 * DetectedSchema.pattern / .confidence / .lineCount is preserved for
 * backward-compatible consumers.
 *
 * Does NOT reimplement scoring — delegates to featureWeightedScore via
 * the PhonologicalRegistry (same path as existing compare() calls).
 *
 * docs_fusion_optimal.md §4 (RN extraction) + §5 (similarity).
 */

import type { DetectedSchema, StanzaSchema } from '../core/types';
import { PhonologicalRegistry } from '../core/Registry';
import { splitLyricIntoLines, extractLineTail } from './lyricSegmenter';
import { resolveLang } from '../lid/detectLanguage';

/** Minimum similarity score to consider two lines as rhyming. */
const RHYME_THRESHOLD = 0.65;

/**
 * Generate a label for a given 0-based label index.
 *
 * For indices 0–25: single uppercase letter A–Z.
 * For indices ≥26: two-letter compound AA, AB, … AZ, BA, …
 * This avoids non-alphabetic characters that
 * String.fromCharCode(65 + n) produces for n ≥26.
 */
function labelForIndex(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  const hi = Math.floor(index / 26) - 1;
  const lo = index % 26;
  return String.fromCharCode(65 + hi) + String.fromCharCode(65 + lo);
}

// ─── Internal: score a flat list of line-tail strings ──────────────────────

/**
 * Given an ordered array of line-tail strings, compute a rhyme-labelled
 * pattern (e.g. "AABB") and a mean confidence score.
 *
 * Label sequence is always restarted from A (index 0) — callers that
 * want globally unique labels across stanzas must handle remapping.
 */
function scoreLines(
  tails: string[],
  lang: string,
): { pattern: string; confidence: number } {
  const n = tails.length;
  if (n === 0) return { pattern: '', confidence: 0 };
  if (n === 1) return { pattern: 'A', confidence: 1.0 };

  // Build upper-triangle similarity matrix
  const matrix: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(0) as number[],
  );
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      try {
        const result = PhonologicalRegistry.compare(tails[i]!, tails[j]!, lang);
        matrix[i]![j] = result?.score ?? 0;
      } catch {
        matrix[i]![j] = tails[i] === tails[j] ? 1.0 : 0.0;
      }
    }
  }

  // Greedy label assignment
  const labels: string[] = new Array(n).fill('') as string[];
  let nextIndex = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] !== '') continue;
    labels[i] = labelForIndex(nextIndex++);
    for (let j = i + 1; j < n; j++) {
      if (labels[j] === '' && (matrix[i]![j] ?? 0) >= RHYME_THRESHOLD) {
        labels[j] = labels[i]!;
      }
    }
  }

  // Confidence = mean similarity among rhyming pairs
  const rhymingScores: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (labels[i] === labels[j]) {
        rhymingScores.push(matrix[i]![j] ?? 0);
      }
    }
  }
  const confidence =
    rhymingScores.length > 0
      ? rhymingScores.reduce((s, v) => s + v, 0) / rhymingScores.length
      : 0;

  return { pattern: labels.join(''), confidence };
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Detect the rhyme scheme of a lyric block, with per-stanza resolution.
 *
 * @param text  - Raw lyric text (may include section markers and blank lines).
 * @param lang  - ISO 639-3 language code routed through PhonologicalRegistry,
 *               or 'auto' for automatic language detection. Defaults to 'auto'.
 * @returns DetectedSchema with full-block summary + optional stanzas[] breakdown.
 */
export function detectRhymeScheme(
  text: string,
  lang: string = 'auto',
): DetectedSchema {
  const resolvedLang = resolveLang(text, lang);
  const allLines = splitLyricIntoLines(text, resolvedLang);

  // Only keep rhyme-bearing lines (non-blank, non-annotation)
  const bearingLines = allLines.filter(l => !l.isBlank && !l.isAnnotation);

  if (bearingLines.length < 2) {
    return {
      pattern: 'FREE',
      confidence: 1.0,
      lineCount: bearingLines.length,
    };
  }

  // ── Group by stanza ─────────────────────────────────────────────────────
  const stanzaMap = new Map<number, string[]>();
  for (const line of bearingLines) {
    const bucket = stanzaMap.get(line.stanzaIndex);
    const tail = extractLineTail(line.text);
    if (bucket) {
      bucket.push(tail);
    } else {
      stanzaMap.set(line.stanzaIndex, [tail]);
    }
  }

  const stanzaIndices = [...stanzaMap.keys()].sort((a, b) => a - b);
  const multiStanza = stanzaIndices.length > 1;

  // ── Per-stanza scoring ─────────────────────────────────────────────────
  const stanzas: StanzaSchema[] = [];
  for (const idx of stanzaIndices) {
    const tails = stanzaMap.get(idx)!;
    const { pattern, confidence } = scoreLines(tails, resolvedLang);
    stanzas.push({
      stanzaIndex: idx,
      pattern,
      confidence,
      lineCount: tails.length,
    });
  }

  // ── Full-block summary (backward-compatible) ──────────────────────────
  const allTails = bearingLines.map(l => extractLineTail(l.text));
  const { pattern: blockPattern, confidence: blockConfidence } = scoreLines(
    allTails,
    resolvedLang,
  );

  return {
    pattern: blockPattern,
    confidence: blockConfidence,
    lineCount: bearingLines.length,
    stanzas: multiStanza ? stanzas : undefined,
  };
}

/**
 * Normalise a raw pattern to a canonical scheme label.
 * Known patterns are kept as-is; anything else returns 'CUSTOM'.
 */
export function canonicalizeScheme(pattern: string): string {
  const canonical = new Set([
    'AABB', 'ABAB', 'ABBA', 'ABCABC', 'AAAA',
    'ABCB', 'AAAB', 'AABA', 'ABAC',
    'ABABCC', 'AAABAB',
  ]);
  return canonical.has(pattern) ? pattern : 'CUSTOM';
}

/**
 * Rhyme Engine v2 — Strophic Rhyme Scheme Detector
 *
 * Consumes an array of RhymeResult (pairwise scores) and a stanza of lines,
 * then identifies the rhyme scheme label (AABB, ABAB, ABBA, ABCABC, terza rima…)
 * and returns a per-line letter assignment.
 *
 * Usage:
 *   import { detectRhymeScheme } from './rhymeSchemeDetector';
 *   const result = detectRhymeScheme(lines, lang, rhymeScoreFn);
 *
 * The detector is self-contained: it calls rhymeScore() internally
 * so callers only need to pass raw lines.
 */

import type { LangCode, RhymeCategory, RhymeResult, SchemeLabel, SchemeResult } from './types';
import { rhymeScore } from './engine';

// ─── Threshold ───────────────────────────────────────────────────────────────

// A pair is considered rhyming if score ≥ RHYME_THRESHOLD.
// 'sufficient' category starts at 0.60; we use 0.58 to allow slight tolerance.
const RHYME_THRESHOLD = 0.58;

// Category weights used for confidence computation
const CATEGORY_WEIGHT: Record<RhymeCategory, number> = {
  perfect:    1.0,
  rich:       0.9,
  sufficient: 0.7,
  weak:       0.4,
  none:       0.0,
};

// ─── Letter assignment ────────────────────────────────────────────────────────

/**
 * Assigns a letter to each line based on rhyme clusters.
 * Lines that rhyme with each other get the same letter.
 * New rhyme group → next letter (A, B, C …).
 */
function assignLetters(
  lines: string[],
  rhymes: (i: number, j: number) => boolean
): string[] {
  const letters: string[] = new Array(lines.length).fill('');
  let nextCode = 65; // 'A'

  for (let i = 0; i < lines.length; i++) {
    if (letters[i]) continue;
    const letter = String.fromCharCode(nextCode++);
    letters[i] = letter;
    for (let j = i + 1; j < lines.length; j++) {
      if (!letters[j] && rhymes(i, j)) {
        letters[j] = letter;
      }
    }
  }

  // Assign fallback 'X' to lines with no detected rhyme
  for (let i = 0; i < letters.length; i++) {
    if (!letters[i]) letters[i] = 'X';
  }

  return letters;
}

// ─── Pattern matching ─────────────────────────────────────────────────────────

function joinLetters(letters: string[]): string {
  return letters.join('');
}

function detectLabel(letters: string[], n: number): SchemeLabel {
  const pat = joinLetters(letters);

  // Monorhyme: all same letter
  if (new Set(letters).size === 1) return 'MONORHYME';

  // Exact scheme matching for common stanza sizes
  if (n === 4) {
    if (pat === 'AABB') return 'AABB';
    if (pat === 'ABAB') return 'ABAB';
    if (pat === 'ABBA') return 'ABBA';
  }
  if (n === 6) {
    if (pat === 'AABBCC') return 'AABB';
    if (pat === 'ABABAB') return 'ABAB';
    if (pat === 'ABCABC') return 'ABCABC';
  }

  // Terza rima: ABA BCB CDC … (triplets, n divisible by 3)
  if (n >= 3 && n % 3 === 0) {
    let isTerza = true;
    for (let i = 0; i < n - 2; i += 3) {
      if (letters[i] !== letters[i + 2]) { isTerza = false; break; }
      if (i + 3 < n && letters[i + 1] !== letters[i + 3]) { isTerza = false; break; }
    }
    if (isTerza) return 'TERZA_RIMA';
  }

  // Couplet pattern: AABBCC… (any length)
  let isCouplets = true;
  for (let i = 0; i < n - 1; i += 2) {
    if (letters[i] !== letters[i + 1]) { isCouplets = false; break; }
  }
  if (isCouplets && n % 2 === 0) return 'AABB';

  // Alternating pattern: ABABAB…
  let isAlternate = true;
  for (let i = 0; i < n - 2; i++) {
    if (letters[i] !== letters[i + 2]) { isAlternate = false; break; }
  }
  if (isAlternate && n % 2 === 0) return 'ABAB';

  // Free verse: 'X' dominates or no pattern found
  const xCount = letters.filter(l => l === 'X').length;
  if (xCount > n / 2) return 'FREE_VERSE';

  return 'CUSTOM';
}

// ─── Confidence computation ───────────────────────────────────────────────────

/**
 * Confidence = weighted average of rhyme quality within detected pairs.
 * For AABB: expected pairs are (0,1),(2,3)…
 * For ABAB: expected pairs are (0,2),(1,3)…
 * For others: use all same-letter pairs.
 */
function computeConfidence(
  letters: string[],
  pairScores: SchemeResult['pairScores']
): number {
  // Build a fast lookup: pairScore[i][j]
  const scoreMap = new Map<string, RhymeResult>();
  for (const { i, j, result } of pairScores) {
    scoreMap.set(`${i},${j}`, result);
  }

  // Collect all same-letter pairs
  const rhymePairs: Array<[number, number]> = [];
  for (let i = 0; i < letters.length; i++) {
    for (let j = i + 1; j < letters.length; j++) {
      if (letters[i] === letters[j] && letters[i] !== 'X') {
        rhymePairs.push([i, j]);
      }
    }
  }

  if (!rhymePairs.length) return 0;

  const total = rhymePairs.reduce((acc, [i, j]) => {
    const r = scoreMap.get(`${i},${j}`);
    return acc + (r ? CATEGORY_WEIGHT[r.category] : 0);
  }, 0);

  return total / rhymePairs.length;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detects the rhyme scheme of a stanza.
 *
 * @param lines   Array of verse lines (raw strings)
 * @param lang    Language code for all lines (mixed-lang stanzas: pass langA per line via overload)
 * @param window  Maximum line distance to test for rhyme (default: 6)
 */
export function detectRhymeScheme(
  lines: string[],
  lang: LangCode,
  window = 6
): SchemeResult {
  const warnings: string[] = [];
  const n = lines.length;

  if (n < 2) {
    return {
      letters: lines.map((_, i) => String.fromCharCode(65 + i)),
      label: 'FREE_VERSE',
      confidence: 0,
      pairScores: [],
      warnings: ['stanza-too-short'],
      isProxied: false,
    };
  }

  // Compute all pairwise rhyme scores within window
  const pairScores: SchemeResult['pairScores'] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n && j - i <= window; j++) {
      const result = rhymeScore(lines[i]!, lines[j]!, lang, lang);
      warnings.push(...result.warnings.map(w => `[${i},${j}]:${w}`));
      pairScores.push({ i, j, result });
    }
  }

  // Build rhyme adjacency function
  const rhymeMatrix = new Map<string, boolean>();
  for (const { i, j, result } of pairScores) {
    rhymeMatrix.set(`${i},${j}`, result.score >= RHYME_THRESHOLD);
  }
  const rhymes = (i: number, j: number): boolean =>
    rhymeMatrix.get(`${Math.min(i,j)},${Math.max(i,j)}`) ?? false;

  // Assign letters and detect label
  const letters    = assignLetters(lines, rhymes);
  const label      = detectLabel(letters, n);
  const confidence = computeConfidence(letters, pairScores);

  return { letters, label, confidence, pairScores, warnings, isProxied: false };
}

/**
 * Per-line language variant: each line can be a different language.
 * Useful for multilingual stanzas (code-switching rap, slam, etc.).
 */
export function detectRhymeSchemeMultiLang(
  lines: Array<{ text: string; lang: LangCode }>,
  window = 6
): SchemeResult {
  const warnings: string[] = [];
  const n = lines.length;

  if (n < 2) {
    return {
      letters: lines.map((_, i) => String.fromCharCode(65 + i)),
      label: 'FREE_VERSE',
      confidence: 0,
      pairScores: [],
      warnings: ['stanza-too-short'],
      isProxied: false,
    };
  }

  const pairScores: SchemeResult['pairScores'] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n && j - i <= window; j++) {
      const a = lines[i]!;
      const b = lines[j]!;
      const result = rhymeScore(a.text, b.text, a.lang, b.lang);
      warnings.push(...result.warnings.map(w => `[${i},${j}]:${w}`));
      pairScores.push({ i, j, result });
    }
  }

  const rhymeMatrix = new Map<string, boolean>();
  for (const { i, j, result } of pairScores) {
    rhymeMatrix.set(`${i},${j}`, result.score >= RHYME_THRESHOLD);
  }
  const rhymes = (i: number, j: number): boolean =>
    rhymeMatrix.get(`${Math.min(i,j)},${Math.max(i,j)}`) ?? false;

  const letters    = assignLetters(lines.map(l => l.text), rhymes);
  const label      = detectLabel(letters, n);
  const confidence = computeConfidence(letters, pairScores);

  return { letters, label, confidence, pairScores, warnings, isProxied: false };
}

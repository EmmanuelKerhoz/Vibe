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
import { splitLyricIntoLines, extractLineEndingUnit } from './lyricSegmenter';
import { resolveLang } from '../lid/detectLanguage';

// ─── Adaptive threshold by language family ───────────────────────────────────

/**
 * Per-family similarity floor for two lines to be considered rhyming.
 *
 * Rationale:
 *  - CJK / tonal-CJK (zh, ja, ko): tight phoneme inventory, high precision
 *    expected → raise to 0.72 to reduce false positives.
 *  - Tonal Latin (vi, yo, tw, ewe, ln): tone diacritics encoded in RN,
 *    near-rhyme is semantically loaded → 0.68.
 *  - Semitic (ar, he): trilateral root overlap inflates scores → raise to 0.70.
 *  - Germanic (en, de, nl, sv…): consonant clusters → loosen to 0.62.
 *  - Romance (fr, es, it, pt, ca): rich vowel matching → 0.67.
 *  - Default: 0.65 (original constant, unchanged for unclassified langs).
 */
function getLangThreshold(lang: string): number {
  const l = lang.toLowerCase();
  // CJK / East Asian
  if (['zh', 'zh-cn', 'zh-tw', 'yue', 'ja', 'ko'].includes(l)) return 0.72;
  // Tonal Latin
  if (['vi', 'yo', 'tw', 'ewe', 'ln', 'ibo', 'ba'].includes(l)) return 0.68;
  // Semitic
  if (['ar', 'he', 'fa', 'ur'].includes(l)) return 0.70;
  // Germanic
  if (['en', 'de', 'nl', 'sv', 'da', 'no', 'af', 'is'].includes(l)) return 0.62;
  // Romance
  if (['fr', 'es', 'it', 'pt', 'ca', 'ro'].includes(l)) return 0.67;
  return 0.65;
}

// ─── Label helper ─────────────────────────────────────────────────────────────

function labelForIndex(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  const hi = Math.floor(index / 26) - 1;
  const lo = index % 26;
  return String.fromCharCode(65 + hi) + String.fromCharCode(65 + lo);
}

// ─── Internal scorer ──────────────────────────────────────────────────────────

function scoreLines(
  tails: string[],
  lang: string,
): { pattern: string; confidence: number } {
  const n = tails.length;
  if (n === 0) return { pattern: '', confidence: 0 };
  if (n === 1) return { pattern: 'A', confidence: 1.0 };

  const threshold = getLangThreshold(lang);

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

  const labels: string[] = new Array(n).fill('') as string[];
  let nextIndex = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] !== '') continue;
    labels[i] = labelForIndex(nextIndex++);
    for (let j = i + 1; j < n; j++) {
      if (labels[j] === '' && (matrix[i]![j] ?? 0) >= threshold) {
        labels[j] = labels[i]!;
      }
    }
  }

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

// ─── Public API ───────────────────────────────────────────────────────────────

export function detectRhymeScheme(
  text: string,
  lang: string = 'auto',
): DetectedSchema {
  const resolvedLang = resolveLang(text, lang);
  const allLines = splitLyricIntoLines(text, resolvedLang);

  const bearingLines = allLines.filter(l => !l.isBlank && !l.isAnnotation);

  if (bearingLines.length < 2) {
    return {
      pattern: 'FREE',
      confidence: 1.0,
      lineCount: bearingLines.length,
    };
  }

  const stanzaMap = new Map<number, string[]>();
  for (const line of bearingLines) {
    const bucket = stanzaMap.get(line.stanzaIndex);
    const tail = extractLineEndingUnit(line.text, resolvedLang).normalized;
    if (bucket) {
      bucket.push(tail);
    } else {
      stanzaMap.set(line.stanzaIndex, [tail]);
    }
  }

  const stanzaIndices = [...stanzaMap.keys()].sort((a, b) => a - b);
  const multiStanza = stanzaIndices.length > 1;

  const stanzas: StanzaSchema[] = [];
  for (const idx of stanzaIndices) {
    const tails = stanzaMap.get(idx)!;
    const { pattern, confidence } = scoreLines(tails, resolvedLang);
    stanzas.push({ stanzaIndex: idx, pattern, confidence, lineCount: tails.length });
  }

  const allTails = bearingLines.map(
    l => extractLineEndingUnit(l.text, resolvedLang).normalized,
  );
  const { pattern: blockPattern, confidence: blockConfidence } = scoreLines(
    allTails,
    resolvedLang,
  );

  return {
    pattern: blockPattern,
    confidence: blockConfidence,
    lineCount: bearingLines.length,
    ...(multiStanza && { stanzas }),
  };
}

export function canonicalizeScheme(pattern: string): string {
  const canonical = new Set([
    'AABB', 'ABAB', 'ABBA', 'ABCABC', 'AAAA',
    'ABCB', 'AAAB', 'AABA', 'ABAC',
    'ABABCC', 'AAABAB',
  ]);
  return canonical.has(pattern) ? pattern : 'CUSTOM';
}

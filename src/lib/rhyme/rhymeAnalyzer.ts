/**
 * rhymeAnalyzer.ts
 * Orchestrator — delegates to engine.rhymeScore() for all family-specific
 * scoring and charSpan computation.
 *
 * v4.2 fix: replaced standalone featureWeightedScore+morphoNucleus path
 * with a direct call to rhymeScore() from engine.ts.  This ensures:
 *   - Family-specific nucleus extraction (ROM/GER/SLV/…) is used
 *   - charSpanA / charSpanB are populated and forwarded to RhymePair
 *   - Tonal penalty and embedding blend follow the engine contract
 *
 * Output: RhymeAnalysisResult with per-pair scored rhymes, char spans,
 *         and block-level scheme.
 */

import {
  segmentVerses,
  type RhymeScheme,
  type RhymePosition,
  type VerseLine,
} from './verseSegmenter';
import { detectSpanLangs } from './lidSpanDetector';
import { rhymeScore, type RhymeScoreOptions } from './engine';
import type { RhymeCharSpan, LangCode } from './types';

// ── Types ────────────────────────────────────────────────────────────────────

export type RhymeType = 'rich' | 'sufficient' | 'assonance' | 'weak' | 'none';

export interface RhymePair {
  lineA: number;
  lineB: number;
  wordA: string;
  wordB: string;
  nucleusA: string;
  nucleusB: string;
  langcodeA: string;
  langcodeB: string;
  position: RhymePosition;
  rawScore: number;
  finalScore: number;
  rhymeType: RhymeType;
  isCrossLingual: boolean;
  /** Character span of the rhyming unit within the original lineA string. */
  charSpanA?: RhymeCharSpan;
  /** Character span of the rhyming unit within the original lineB string. */
  charSpanB?: RhymeCharSpan;
}

export interface RhymeAnalysisResult {
  pairs: RhymePair[];
  scheme: RhymeScheme;
  dominantLang: string;
  isMixed: boolean;
  processingMs: number;
}

// ── Score → rhymeType thresholds (per position) ──────────────────────────────

const THRESHOLDS: Record<RhymePosition, { rich: number; sufficient: number; assonance: number; weak: number }> = {
  end:      { rich: 0.90, sufficient: 0.75, assonance: 0.55, weak: 0.35 },
  internal: { rich: 0.85, sufficient: 0.70, assonance: 0.50, weak: 0.30 },
  initial:  { rich: 0.80, sufficient: 0.65, assonance: 0.45, weak: 0.25 },
  all:      { rich: 0.85, sufficient: 0.70, assonance: 0.50, weak: 0.30 },
};

function classifyScore(score: number, position: RhymePosition): RhymeType {
  const t = THRESHOLDS[position];
  if (score >= t.rich)       return 'rich';
  if (score >= t.sufficient) return 'sufficient';
  if (score >= t.assonance)  return 'assonance';
  if (score >= t.weak)       return 'weak';
  return 'none';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLineText(line: VerseLine): string {
  return line.tokens.join(' ');
}

function getLineWord(
  line: VerseLine,
  position: RhymePosition
): string {
  const tokens = line.tokens;
  if (!tokens.length) return '';
  if (position === 'end' || position === 'all') return tokens[tokens.length - 1] ?? '';
  if (position === 'initial') return tokens[0] ?? '';
  return tokens[Math.floor(tokens.length / 2)] ?? '';
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function analyzeBlock(
  text: string,
  options: {
    scheme?: RhymeScheme;
    position?: RhymePosition;
    defaultLang?: string;
    toneSensitive?: boolean;
    embeddingBlend?: number;
    multiSyllabic?: boolean;
  } = {}
): Promise<RhymeAnalysisResult> {
  const t0 = performance.now();

  const {
    scheme = 'adjacent',
    position = 'end',
    defaultLang = 'fr',
  } = options;

  // Step 1 — Verse segmentation
  const block = segmentVerses(text, scheme, position);

  // Step 2 — LID span detection per line
  const lineSpans = block.lines.map(line =>
    detectSpanLangs(line.tokens, defaultLang)
  );

  const dominantLang = lineSpans
    .map(s => s.dominantLang)
    .reduce((acc, lc) => {
      const counts: Record<string, number> = {};
      [acc, lc].forEach(l => (counts[l] = (counts[l] ?? 0) + 1));
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0];
    });

  const isMixed = lineSpans.some(s => s.isMixed);

  // Step 3–5 — Evaluate line pairs via engine.rhymeScore()
  const pairs: RhymePair[] = [];

  const engineOpts: RhymeScoreOptions = {
    position,
    useEmbedding: false, // sync path; upgrade to rhymeScoreAsync for embedding
  };

  for (const [idxA, idxB] of block.linePairs) {
    const lineA = block.lines[idxA];
    const lineB = block.lines[idxB];
    if (!lineA || !lineB) continue;

    const wordA = getLineWord(lineA, position);
    const wordB = getLineWord(lineB, position);
    if (!wordA || !wordB) continue;

    // Langcode per word
    const spanA = lineSpans[idxA];
    const spanB = lineSpans[idxB];
    if (!spanA || !spanB) continue;
    const tokenLangA = spanA.tokens.find(t => t.token.toLowerCase() === wordA.toLowerCase());
    const tokenLangB = spanB.tokens.find(t => t.token.toLowerCase() === wordB.toLowerCase());
    const langcodeA = (tokenLangA?.langcode ?? spanA.dominantLang) as LangCode;
    const langcodeB = (tokenLangB?.langcode ?? spanB.dominantLang) as LangCode;

    // Reconstruct full line text for charSpan computation in engine
    const lineTextA = getLineText(lineA);
    const lineTextB = getLineText(lineB);

    // Delegate entirely to engine — gets family dispatch, charSpan, tonal penalty
    const result = rhymeScore(lineTextA, lineTextB, langcodeA, langcodeB, engineOpts);

    const nucleusA = result.nucleusA.vowels + result.nucleusA.coda;
    const nucleusB = result.nucleusB.vowels + result.nucleusB.coda;

    pairs.push({
      lineA: idxA,
      lineB: idxB,
      wordA,
      wordB,
      nucleusA,
      nucleusB,
      langcodeA,
      langcodeB,
      position,
      rawScore:   result.score,
      finalScore: result.score,
      rhymeType:  classifyScore(result.score, position),
      isCrossLingual: langcodeA !== langcodeB,
      charSpanA: result.charSpanA,
      charSpanB: result.charSpanB,
    });
  }

  return {
    pairs,
    scheme,
    dominantLang,
    isMixed,
    processingMs: performance.now() - t0,
  };
}

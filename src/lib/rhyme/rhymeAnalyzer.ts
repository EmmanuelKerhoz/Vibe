/**
 * rhymeAnalyzer.ts
 * Orchestrator — ties all 5 steps into a single analyzeBlock() entry point.
 *
 * Pipeline:
 *   1. verseSegmenter  → VerseLine[]
 *   2. lidSpanDetector → per-token langcodes
 *   3. morphoNucleus   → nucleus per word
 *   4. tonalDistance   → penalty if tonal lang
 *   5. embeddingScorer → level-4 blend (async)
 *
 * Output: RhymeAnalysisResult with per-pair scored rhymes and block-level scheme.
 */

import {
  segmentVerses,
  type RhymeScheme,
  type RhymePosition,
  type VerseLine,
} from './verseSegmenter';
import { detectSpanLangs } from './lidSpanDetector';
import { extractNucleus, type LangFamily } from './morphoNucleus';
import { applyTonalPenalty } from './toneMatrix';
import { embeddingScore, blendScores } from './embeddingScorer';

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
  rawScore: number;      // feature-weighted
  embScore?: number;     // embedding level
  finalScore: number;    // blended + tonal penalty applied
  rhymeType: RhymeType;
  isCrossLingual: boolean;
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

// ── Naive feature-weighted scorer (placeholder for full algo dispatch) ────────
// In production this delegates to the langFamily-specific BaseRhymeAlgo.
// Here we compute a fast Levenshtein-ratio on nucleus strings as baseline.

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_v, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i]![j] = a[i-1] === b[j-1]
        ? dp[i-1]![j-1]!
        : 1 + Math.min(dp[i-1]![j]!, dp[i]![j-1]!, dp[i-1]![j-1]!);
  return dp[m]![n]!;
}

function featureWeightedScore(nucleusA: string, nucleusB: string): number {
  if (nucleusA === nucleusB) return 1.0;
  if (!nucleusA || !nucleusB) return 0.0;
  const maxLen = Math.max(nucleusA.length, nucleusB.length);
  return 1 - levenshtein(nucleusA, nucleusB) / maxLen;
}

// ── Helpers ──────────────────────────────────────────────────────────────────



function familyFromLangcode(lc: string): LangFamily {
  const map: Record<string, LangFamily> = {
    fr: 'ROM', es: 'ROM', pt: 'ROM', it: 'ROM', ro: 'ROM',
    en: 'GER', de: 'GER', nl: 'GER', sv: 'GER', no: 'GER', da: 'GER',
    ru: 'SLV', pl: 'SLV', cs: 'SLV', uk: 'SLV',
    ar: 'SEM', he: 'SEM', am: 'SEM',
    th: 'TAI', lo: 'TAI',
    zh: 'SIN', yue: 'SIN',
    ja: 'JAP',
    ko: 'KOR',
    hi: 'IND', bn: 'IND', ur: 'IND',
    tr: 'AGG', fi: 'AGG', hu: 'AGG', kk: 'AGG',
    sw: 'BNT', ln: 'BNT', yo: 'KWA', ee: 'KWA',
    bam: 'KWA', dyu: 'KWA', mi: 'KWA',
    ha: 'CRV', ig: 'CRV',
  };
  return map[lc] ?? 'DEFAULT';
}

// ── Pair extractor ────────────────────────────────────────────────────────────

function getLineWord(
  line: VerseLine,
  position: RhymePosition
): string {
  const tokens = line.tokens;
  if (!tokens.length) return '';
  if (position === 'end' || position === 'all') return tokens[tokens.length - 1] ?? '';
  if (position === 'initial') return tokens[0] ?? '';
  // internal: middle token
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
    toneSensitive = true,
    embeddingBlend = 0.4,
    multiSyllabic = false,
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

  // Step 3–5 — Evaluate line pairs
  const pairs: RhymePair[] = [];

  for (const [idxA, idxB] of block.linePairs) {
    const lineA = block.lines[idxA];
    const lineB = block.lines[idxB];
    if (!lineA || !lineB) continue;

    const wordA = getLineWord(lineA, position);
    const wordB = getLineWord(lineB, position);
    if (!wordA || !wordB) continue;

    // Langcode for each word
    const spanA = lineSpans[idxA];
    const spanB = lineSpans[idxB];
    if (!spanA || !spanB) continue;
    const tokenLangA = spanA.tokens.find(t => t.token.toLowerCase() === wordA.toLowerCase());
    const tokenLangB = spanB.tokens.find(t => t.token.toLowerCase() === wordB.toLowerCase());
    const langcodeA = tokenLangA?.langcode ?? spanA.dominantLang;
    const langcodeB = tokenLangB?.langcode ?? spanB.dominantLang;
    const familyA = tokenLangA?.family ?? familyFromLangcode(langcodeA);

    // Step 3 — Nucleus extraction
    const { nucleus: nucleusA } = extractNucleus(wordA, familyA);
    const { nucleus: nucleusB } = extractNucleus(wordB, familyFromLangcode(langcodeB));

    // Step 4 — Feature-weighted baseline score
    const rawScore = featureWeightedScore(nucleusA, nucleusB);

    // Tonal penalty
    let penalizedScore = rawScore;
    if (toneSensitive) {
      // Tone extraction: look for trailing digit or diacritic marker
      const toneA = wordA.match(/[0-9]$/)?.[0] ?? 'UNKNOWN';
      const toneB = wordB.match(/[0-9]$/)?.[0] ?? 'UNKNOWN';
      penalizedScore = applyTonalPenalty(rawScore, familyA as any, langcodeA, toneA, toneB);
    }

    // Step 5 — Embedding blend (async)
    const phonesA = nucleusA.split('');
    const phonesB = nucleusB.split('');
    const { score: embScore } = await embeddingScore(phonesA, phonesB, familyA, langcodeA);
    const finalScore = blendScores(penalizedScore, embScore, embeddingBlend);

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
      rawScore,
      embScore,
      finalScore,
      rhymeType: classifyScore(finalScore, position),
      isCrossLingual: langcodeA !== langcodeB,
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

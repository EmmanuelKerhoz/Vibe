/**
 * Rhyme Engine v3 — Main Orchestrator
 *
 * analyzeBlock(text, options) → BlockAnalysisResult
 * compareWords(a, b, options) → RhymeResult
 */

import type {
  BlockAnalysisResult, LangCode, RhymePosition, RhymeResult,
  SchemeLabel, SchemeResult,
} from './types';
import { segmentBlock, extractLineEndingUnit } from './normalize';
import { routeToFamily } from './router';
import { extractNucleus } from './nucleus';
import { scoreNuclei } from './scoring';
import type { RhymePositionMode } from './scoring';
import { detectCodeSwitching, mergeAdjacentSpans } from './lidDetector';

export interface CompareOptions {
  lang?: LangCode;
  position?: RhymePosition;
  toneSensitive?: boolean;
}

export interface BlockOptions extends CompareOptions {
  scanInternalRhymes?: boolean;
  detectCS?: boolean;
  /**
   * Minimum score for two lines to be considered rhyming and grouped into
   * the same scheme family (A, B, C…).
   * Default: 0.75 (previously 0.55 — raised to prevent weak assonances
   * from polluting rhyme families).
   */
  minRhymeScore?: number;
}

export function compareWords(wordA: string, wordB: string, opts: CompareOptions = {}): RhymeResult {
  const lang = opts.lang ?? ('__unknown__' as LangCode);
  const { family, lowResource } = routeToFamily(lang);
  const unitA = extractLineEndingUnit(wordA, lang);
  const unitB = extractLineEndingUnit(wordB, lang);
  const nucleusA = extractNucleus(unitA.surface || wordA, family, lang);
  const nucleusB = extractNucleus(unitB.surface || wordB, family, lang);
  const { score, category } = scoreNuclei(nucleusA, nucleusB, {
    family, lang,
    position: (opts.position as RhymePositionMode) ?? 'end',
    toneSensitive: opts.toneSensitive ?? true,
  });
  return {
    score, category, family,
    langA: lang, langB: lang,
    unitA, unitB, nucleusA, nucleusB,
    lowResourceFallback: lowResource,
    warnings: [
      ...unitA.warnings.map(w => `A:${w}`),
      ...unitB.warnings.map(w => `B:${w}`),
    ],
    position: opts.position ?? 'end',
    csDetected: false,
  };
}

const DEFAULT_MIN_RHYME_SCORE = 0.75;

function detectScheme(pairMap: Map<string, number>, minScore: number): SchemeLabel {
  const n = Math.max(...[...pairMap.keys()].flatMap(k => k.split(':').map(Number))) + 1;
  if (n < 2) return 'FREE_VERSE';
  const rhymes = (i: number, j: number) => (pairMap.get(`${i}:${j}`) ?? 0) >= minScore;
  let aabb = 0, abab = 0;
  for (let i = 0; i + 1 < n; i += 2) if (rhymes(i, i + 1)) aabb++;
  for (let i = 0; i + 2 < n; i++) if (rhymes(i, i + 2)) abab++;
  const abba = (n >= 4 && rhymes(0, 3) && rhymes(1, 2)) ? 2 : 0;
  let mono = 0;
  for (let i = 0; i + 1 < n; i++) if (rhymes(i, i + 1)) mono++;
  const best = Math.max(aabb, abab, abba, mono);
  if (best === 0) return 'FREE_VERSE';
  if (abba >= best) return 'ABBA';
  if (aabb >= best) return 'AABB';
  if (abab >= best) return 'ABAB';
  if (mono >= best) return 'MONORHYME';
  return 'CUSTOM';
}

function assignSchemeLetters(
  pairs: Array<{ i: number; j: number; score: number }>,
  n: number,
  minScore: number,
): string[] {
  const groupOf = new Array<number>(n).fill(-1);
  let nextCode = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ps = pairs.find(p => p.i === i && p.j === j);
      if (ps && ps.score >= minScore) {
        const gi = groupOf[i]!, gj = groupOf[j]!;
        if (gi === -1 && gj === -1) groupOf[i] = groupOf[j] = nextCode++;
        else if (gi !== -1) groupOf[j] = gi;
        else groupOf[i] = gj;
      }
    }
    if (groupOf[i] === -1) groupOf[i] = nextCode++;
  }
  const codeToLetter: Record<number, string> = {};
  let li = 0;
  return Array.from({ length: n }, (_, i) => {
    const g = groupOf[i]!;
    if (!(g in codeToLetter)) codeToLetter[g] = String.fromCharCode(65 + li++);
    return codeToLetter[g]!;
  });
}

export function analyzeBlock(text: string, opts: BlockOptions = {}): BlockAnalysisResult {
  const lang = opts.lang ?? ('__unknown__' as LangCode);
  const minScore = opts.minRhymeScore ?? DEFAULT_MIN_RHYME_SCORE;
  const { family } = routeToFamily(lang);
  const csWarnings: string[] = [];
  const lines = segmentBlock(text, lang);
  const n = lines.length;

  if (n === 0) return {
    lines: [], lineSpans: [], csWarnings: [],
    scheme: { letters: [], label: 'FREE_VERSE', confidence: 0, pairScores: [], warnings: ['empty-block'], isProxied: false },
  };

  const units   = lines.map(l => extractLineEndingUnit(l, lang));
  const nuclei  = units.map(u => extractNucleus(u.surface || '', family, lang));

  // Build per-line span data for UI highlighting
  const lineSpans: BlockAnalysisResult['lineSpans'] = nuclei.map((nucleus, idx) => ({
    lineIndex: idx,
    surface: units[idx]!.surface,
    charSpanStart: nucleus.charSpanStart ?? -1,
    charSpanEnd:   nucleus.charSpanEnd   ?? -1,
  }));

  if (opts.detectCS !== false) {
    lines.forEach((line, idx) => {
      const tokens = line.split(/\s+/).filter(Boolean);
      mergeAdjacentSpans(detectCodeSwitching(tokens, lang))
        .forEach(sp => csWarnings.push(`line${idx}:cs:${sp.lang}@${sp.start}`));
    });
  }

  const rawPairs: Array<{ i: number; j: number; score: number; result: RhymeResult }> = [];
  const pairMap = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const { score, category } = scoreNuclei(nuclei[i]!, nuclei[j]!, {
        family, lang, position: 'end', toneSensitive: opts.toneSensitive ?? true,
      });
      pairMap.set(`${i}:${j}`, score);
      const csDetected = csWarnings.some(w => w.startsWith(`line${i}:cs:`) || w.startsWith(`line${j}:cs:`));
      rawPairs.push({ i, j, score, result: {
        score, category, family,
        langA: lang, langB: lang,
        unitA: units[i]!, unitB: units[j]!,
        nucleusA: nuclei[i]!, nucleusB: nuclei[j]!,
        lowResourceFallback: false, warnings: [],
        position: 'end', csDetected,
      }});
    }
  }

  const letters = assignSchemeLetters(rawPairs, n, minScore);
  const label   = detectScheme(pairMap, minScore);
  const confidence = rawPairs.length > 0
    ? rawPairs.filter(p => p.score >= minScore).length / rawPairs.length : 0;

  const scheme: SchemeResult = {
    letters, label, confidence,
    pairScores: rawPairs.map(p => ({ i: p.i, j: p.j, result: p.result })),
    warnings: [], isProxied: false,
  };

  let positionRhymes: BlockAnalysisResult['positionRhymes'] = undefined;

  if (opts.scanInternalRhymes && opts.position && opts.position !== 'end') {
    positionRhymes = [];
    for (let li = 0; li < n; li++) {
      const tokens = lines[li]!.split(/\s+/).filter(Boolean);
      if (tokens.length < 2) continue;
      const lineRhymes: Array<{ tokenA: string; tokenB: string; result: RhymeResult }> = [];
      for (let ti = 0; ti < tokens.length; ti++) {
        for (let tj = ti + 1; tj < tokens.length; tj++) {
          const match =
            opts.position === 'internal' ? (ti > 0 && tj < tokens.length - 1) :
            opts.position === 'initial'  ? (ti === 0) : true;
          if (!match) continue;
          const result = compareWords(tokens[ti]!, tokens[tj]!, {
            lang,
            position: opts.position,
            ...(opts.toneSensitive !== undefined ? { toneSensitive: opts.toneSensitive } : {}),
          });
          if (result.score >= minScore)
            lineRhymes.push({ tokenA: tokens[ti]!, tokenB: tokens[tj]!, result });
        }
      }
      if (lineRhymes.length > 0) positionRhymes.push({ lineIndex: li, tokenPairs: lineRhymes });
    }
  }

  return {
    lines,
    lineSpans,
    scheme,
    ...(positionRhymes !== undefined ? { positionRhymes } : {}),
    csWarnings,
  };
}

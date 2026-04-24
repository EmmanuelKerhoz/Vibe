/**
 * verseSegmenter.ts
 * Step 1 — Split a text block into verse lines, detect RTL, handle CJK.
 * Supports rhyme scheme detection: adjacent (AABB), alternate (ABAB), all.
 */

export type RhymeScheme = 'adjacent' | 'alternate' | 'all';
export type RhymePosition = 'end' | 'internal' | 'initial' | 'all';

export interface VerseLine {
  index: number;
  text: string;
  isRTL: boolean;
  tokens: string[];
  /** Token index pairs to evaluate for rhyme given position mode */
  rhymeTargets: Array<[number, number]>;
}

export interface VerseBlock {
  lines: VerseLine[];
  scheme: RhymeScheme;
  position: RhymePosition;
  /** Pairs of line indices to compare (scheme-derived) */
  linePairs: Array<[number, number]>;
}

const RTL_RANGE = /[\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const CJK_RANGE = /[\u3000-\u9FFF\uF900-\uFAFF\u3400-\u4DBF]/;

/** Tokenize a single line, respecting CJK (character-level) vs. word-level. */
function tokenizeLine(text: string): string[] {
  if (CJK_RANGE.test(text)) {
    // Character-level for ZH/JA — punctuation stripped
    return text.replace(/[\s\p{P}]/gu, '').split('');
  }
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(t => t.replace(/^[^\w\u00C0-\u024F\u0600-\u06FF\u0900-\u097F]+|[^\w\u00C0-\u024F\u0600-\u06FF\u0900-\u097F]+$/gi, ''));
}

/** Derive rhyme target token-pair indices within a line for a given position. */
function deriveRhymeTargets(
  tokens: string[],
  position: RhymePosition
): Array<[number, number]> {
  const n = tokens.length;
  if (n === 0) return [];
  const targets: Array<[number, number]> = [];

  if (position === 'end' || position === 'all') {
    // last token vs. last token of partner line — index stored as [n-1, -1] sentinel
    targets.push([n - 1, -1]);
  }
  if (position === 'initial' || position === 'all') {
    targets.push([0, -2]); // sentinel -2 = initial
  }
  if (position === 'internal' || position === 'all') {
    // every non-terminal token pair within the line (for self-analysis)
    for (let i = 1; i < n - 1; i++) targets.push([i, i]);
  }
  return targets;
}

/** Split raw text into verse lines. Handles \n, hémistiche (//), RTL. */
export function segmentVerses(
  text: string,
  scheme: RhymeScheme = 'adjacent',
  position: RhymePosition = 'end'
): VerseBlock {
  const rawLines = text
    .split(/\n|(?<=[.!?;])\s+/)
    .map(l => l.replace(/\s*\/\/\s*/g, ' ').trim())
    .filter(Boolean);

  const lines: VerseLine[] = rawLines.map((lineText, index) => {
    const isRTL = RTL_RANGE.test(lineText);
    const tokens = isRTL
      ? tokenizeLine(lineText).reverse() // normalise to LTR order for phonetics
      : tokenizeLine(lineText);
    return {
      index,
      text: lineText,
      isRTL,
      tokens,
      rhymeTargets: deriveRhymeTargets(tokens, position),
    };
  });

  const linePairs = buildLinePairs(lines.length, scheme);

  return { lines, scheme, position, linePairs };
}

function buildLinePairs(
  n: number,
  scheme: RhymeScheme
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  if (scheme === 'adjacent') {
    for (let i = 0; i < n - 1; i += 2) pairs.push([i, i + 1]);
  } else if (scheme === 'alternate') {
    for (let i = 0; i < n - 2; i++) pairs.push([i, i + 2]);
  } else {
    // all
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  }
  return pairs;
}

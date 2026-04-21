/**
 * N-gram utilities. We work with token arrays rather than character
 * shingles so that scoring stays aligned with line/word coordinates used
 * by the matchers.
 */

export interface NGramKey {
  readonly n: number;
  readonly key: string;
}

/** Sentinel used to join tokens into a stable, collision-resistant string key. */
const NGRAM_SEP = '\u0001';

/** Build n-grams of size `n` from a token array. */
export const tokenNGrams = (tokens: readonly string[], n: number): string[] => {
  if (n <= 0) return [];
  if (tokens.length < n) return [];
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - n; i += 1) {
    out.push(tokens.slice(i, i + n).join(NGRAM_SEP));
  }
  return out;
};

/** Build n-grams per line, keeping coordinates for downstream matchers. */
export interface LineNGram {
  readonly lineIndex: number;
  readonly tokenStart: number;
  readonly key: string;
}
export const lineNGrams = (
  lineTokens: readonly (readonly string[])[],
  n: number,
): LineNGram[] => {
  const out: LineNGram[] = [];
  for (let li = 0; li < lineTokens.length; li += 1) {
    const tokens = lineTokens[li] ?? [];
    if (tokens.length < n) continue;
    for (let i = 0; i <= tokens.length - n; i += 1) {
      out.push({
        lineIndex: li,
        tokenStart: i,
        key: tokens.slice(i, i + n).join(NGRAM_SEP),
      });
    }
  }
  return out;
};

/** Build n-grams across the whole document (for fingerprinting). */
export const documentNGramSet = (
  tokens: readonly string[],
  sizes: readonly number[],
): Set<string> => {
  const out = new Set<string>();
  for (const n of sizes) for (const k of tokenNGrams(tokens, n)) out.add(`${n}|${k}`);
  return out;
};

/**
 * Locate the longest contiguous matching token sequence between two arrays.
 * Returns `{ length: 0 }` if no overlap; otherwise both start indexes.
 */
export interface LongestCommonSpan {
  readonly length: number;
  readonly aStart: number;
  readonly bStart: number;
}

export const longestCommonContiguous = (
  a: readonly string[],
  b: readonly string[],
): LongestCommonSpan => {
  if (a.length === 0 || b.length === 0) return { length: 0, aStart: 0, bStart: 0 };
  // Rolling 1-D DP to keep memory at O(min(a,b)).
  const [shorter, longer, swapped] = a.length <= b.length ? [a, b, false] : [b, a, true];
  const m = shorter.length;
  let prev = new Uint32Array(m + 1);
  let cur = new Uint32Array(m + 1);
  let best = 0;
  let bestShorterEnd = 0;
  let bestLongerEnd = 0;
  for (let i = 1; i <= longer.length; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      cur[j] = longer[i - 1] === shorter[j - 1] ? (prev[j - 1] ?? 0) + 1 : 0;
      if ((cur[j] ?? 0) > best) {
        best = cur[j] ?? 0;
        bestShorterEnd = j;
        bestLongerEnd = i;
      }
    }
    [prev, cur] = [cur, prev];
    cur.fill(0);
  }
  if (best === 0) return { length: 0, aStart: 0, bStart: 0 };
  const shorterStart = bestShorterEnd - best;
  const longerStart = bestLongerEnd - best;
  return swapped
    ? { length: best, aStart: longerStart, bStart: shorterStart }
    : { length: best, aStart: shorterStart, bStart: longerStart };
};

/** Decode an n-gram key back to its tokens. */
export const decodeNGram = (key: string): string[] => key.split(NGRAM_SEP);

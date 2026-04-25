/**
 * rhymePosition.ts
 * Step 6 — Rhyme position modes: end | internal | initial | all
 *
 * Each mode extracts a different unit from the line before scoring:
 *   end      — last word / last mora sequence (default, legacy behaviour)
 *   internal — all non-terminal words; returns best pair score
 *   initial  — first word
 *   all      — end + internal + initial; returns best score across positions
 *
 * multiSyllabic: number — extends nucleus to last N syllables
 * (rap / multi-syllabic rhyme convention). Default N=1.
 */

export type RhymePosition = 'end' | 'internal' | 'initial' | 'all';

export interface PositionOptions {
  position?: RhymePosition;
  /** Number of tail syllables to include in nucleus for multi-syllabic mode */
  multiSyllabic?: number;
}

/** Threshold by position — internal/initial are harder to match */
export const POSITION_THRESHOLDS: Record<RhymePosition, number> = {
  end:      0.75,
  internal: 0.80,
  initial:  0.85,
  all:      0.75, // governed by whichever position matched
};

// CJK punctuation to strip from token edges
const CJK_PUNCT_RE = /^[\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F\u0021-\u002F\u003A-\u0040。，、！？；：「」『』【】〔〕…—]+|[\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F\u0021-\u002F\u003A-\u0040。，、！？；：「」『』【】〔〕…—]+$/gu;

/**
 * Tokenise a line into words, respecting RTL scripts and CJK.
 * Returns tokens left-to-right in logical order.
 */
export function tokeniseLine(line: string): string[] {
  // CJK: split character by character (no spaces), strip punctuation
  if (/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(line)) {
    return [...line.replace(/\s+/g, '')]
      .filter(ch => !/^[\u3000-\u303F\uFF00-\uFFEF。，、！？；：「」『』【】〔〕…—\u0021-\u002F\u003A-\u0040]$/.test(ch));
  }
  // Default: split on whitespace, strip punctuation from edges
  return line
    .split(/\s+/)
    .map(w => w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter(Boolean);
}

/**
 * Extract candidate units from a line according to position mode.
 * Returns an array of strings to be passed individually to the nucleus extractor.
 * For 'internal'/'all', multiple candidates are returned for best-pair scoring.
 */
export function extractPositionUnits(
  line: string,
  opts: PositionOptions = {}
): string[] {
  const position = opts.position ?? 'end';
  const tokens = tokeniseLine(line);
  if (tokens.length === 0) return [line];

  switch (position) {
    case 'end':
      return [tokens[tokens.length - 1]!];

    case 'initial':
      return [tokens[0]!];

    case 'internal':
      // All tokens except first and last
      return tokens.length > 2 ? tokens.slice(1, -1) : tokens;

    case 'all':
      // Deduplicated union of all positions
      return [...new Set([
        tokens[0]!,
        ...tokens.slice(1, -1),
        tokens[tokens.length - 1]!,
      ])];

    default:
      // Safety fallback for invalid runtime values
      return [tokens[tokens.length - 1]!];
  }
}

/**
 * For multi-syllabic rap rhymes: given a word, return the last N syllables
 * concatenated (heuristic CV syllabifier).
 * Slices from the onset consonant(s) before the Nth-from-last vowel nucleus,
 * preserving the full syllable including any leading consonants.
 */
export function multiSyllabicTail(word: string, n: number): string {
  if (n <= 1) return word;
  const vowelRe = /[aeiouáéíóúàèìòùäëïöüâêîôûãõ]+/gi;
  const boundaries: number[] = [];
  let m;
  while ((m = vowelRe.exec(word)) !== null) {
    boundaries.push(m.index);
  }
  if (boundaries.length <= n) return word;
  // Find the start of the onset consonant(s) before the target vowel.
  // We slice from the previous vowel's end to find where the onset starts,
  // then look back through consonants. Simple heuristic: scan back from the
  // vowel index to find the end of the previous vowel cluster.
  const vowelIdx = boundaries[boundaries.length - n]!;
  // Find end of previous vowel (if any)
  const prevVowelEnd = boundaries.length > n
    ? (() => {
        const prevVowelStart = boundaries[boundaries.length - n - 1]!;
        // advance past previous vowel cluster
        const prevVowelRe = /[aeiouáéíóúàèìòùäëïöüâêîôûãõ]+/gi;
        prevVowelRe.lastIndex = prevVowelStart;
        const pv = prevVowelRe.exec(word);
        return pv ? pv.index + pv[0].length : 0;
      })()
    : 0;
  // The onset starts right after the end of the previous vowel cluster
  const onsetStart = prevVowelEnd;
  // Only include the onset if it's before our target vowel
  const sliceFrom = onsetStart < vowelIdx ? onsetStart : vowelIdx;
  return word.slice(sliceFrom);
}

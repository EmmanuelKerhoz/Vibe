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
 * multiSyllabic=true extends the nucleus to the last N stressed syllables
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

/**
 * Tokenise a line into words, respecting RTL scripts and CJK.
 * Returns tokens left-to-right in logical order.
 */
export function tokeniseLine(line: string): string[] {
  // CJK: split character by character (no spaces)
  if (/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(line)) {
    return [...line.replace(/\s+/g, '')].filter(Boolean);
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
  }
}

/**
 * For multi-syllabic rap rhymes: given a word, return the last N syllables
 * concatenated (heuristic CV syllabifier).
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
  return word.slice(boundaries[boundaries.length - n]!);
}

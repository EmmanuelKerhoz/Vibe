/**
 * lyricSegmenter.ts
 * Splits raw lyric text into rhyme-bearing line arrays.
 * Strips structural markers (Verse, Chorus, etc.) and empty lines.
 * Pure — no side effects, no I/O.
 */

/** A structural section marker pattern (e.g. [Verse 1], [Chorus]) */
const SECTION_MARKER_RE = /^\[.*?\]\s*$/;

/**
 * Split a lyric block into individual rhyme-bearing lines.
 *
 * Rules:
 * 1. Split on \n.
 * 2. Trim each line.
 * 3. Drop empty lines and section markers.
 * 4. Return the ordered array — caller decides grouping.
 */
export function splitIntoRhymingLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !SECTION_MARKER_RE.test(l));
}

/**
 * Extract the rhyme-bearing tail of a line.
 * Returns the last word, lowercased, with punctuation stripped.
 */
export function extractLineTail(line: string): string {
  const words = line.trim().split(/\s+/);
  const last = words[words.length - 1] ?? '';
  return last.toLowerCase().replace(/[.,!?;:"'«»…\-–—]+$/, '');
}

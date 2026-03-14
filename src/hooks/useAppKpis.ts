import { useMemo } from 'react';
import type { Section } from '../types';

export interface LyricsKpis {
  sections: number;
  lines: number;
  words: number;
  characters: number;
}

/** Shared helper — lyric-only lines (excludes meta/label lines). */
const lyricLines = (sec: Section) => sec.lines.filter(l => !l.isMeta);

/**
 * Unified KPI hook (replaces useAppKpis + useLyricsKpis).
 * Returns both the legacy { sectionCount, wordCount, charCount } shape
 * and the richer LyricsKpis { sections, lines, words, characters } shape.
 */
export const useAppKpis = (song: Section[]) => {
  const sectionCount = song.length;

  const wordCount = useMemo(
    () => song.reduce((acc, sec) =>
      acc + lyricLines(sec).reduce(
        (lAcc, line) => lAcc + line.text.split(/\s+/).filter(Boolean).length, 0), 0),
    [song]
  );

  const charCount = useMemo(
    () => song.reduce((acc, sec) =>
      acc + lyricLines(sec).reduce((lAcc, line) => lAcc + line.text.length, 0), 0),
    [song]
  );

  const lineCount = useMemo(
    () => song.reduce((acc, sec) =>
      acc + lyricLines(sec).filter(l => l.text.trim()).length, 0),
    [song]
  );

  /** LyricsKpis-compatible shape for consumers that used useLyricsKpis. */
  const lyricsKpis: LyricsKpis = {
    sections: sectionCount,
    lines: lineCount,
    words: wordCount,
    characters: charCount,
  };

  return { sectionCount, wordCount, charCount, lineCount, lyricsKpis };
};

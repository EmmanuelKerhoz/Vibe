import { useMemo } from 'react';
import type { Section } from '../types';
import { useSongContext } from '../contexts/SongContext';

export interface LyricsKpis {
  sections: number;
  lines: number;
  words: number;
  characters: number;
}

/** Shared helper — lyric-only lines (excludes meta/label lines). */
const lyricLines = (sec: Section) => (sec.lines ?? []).filter(l => !l.isMeta);

/**
 * Unified KPI hook (original signature — rétrocompat).
 * Returns { sectionCount, wordCount, charCount, lineCount, lyricsKpis }.
 */
export const useAppKpis = (song: Section[]) => {
  const sectionCount = song.length;

  const wordCount = useMemo(
    () => song.reduce((acc, sec) =>
      acc + lyricLines(sec).reduce(
        (lAcc, line) => lAcc + (line.text ?? '').split(/\s+/).filter(Boolean).length, 0), 0),
    [song]
  );

  const charCount = useMemo(
    () => song.reduce((acc, sec) =>
      acc + lyricLines(sec).reduce((lAcc, line) => lAcc + (line.text ?? '').length, 0), 0),
    [song]
  );

  const lineCount = useMemo(
    () => song.reduce((acc, sec) =>
      acc + lyricLines(sec).filter(l => (l.text ?? '').trim()).length, 0),
    [song]
  );

  const lyricsKpis: LyricsKpis = {
    sections: sectionCount,
    lines: lineCount,
    words: wordCount,
    characters: charCount,
  };

  return { sectionCount, wordCount, charCount, lineCount, lyricsKpis };
};

/**
 * Variante sans param — source song via SongContext.
 * Usage interne : StatusBar, InsightsBar (pas besoin de prop drilling).
 */
export const useAppKpisFromContext = () => {
  const { song } = useSongContext();
  return useAppKpis(song);
};

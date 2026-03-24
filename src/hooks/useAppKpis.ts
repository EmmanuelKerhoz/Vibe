import { useMemo } from 'react';
import { useSongContext } from '../contexts/SongContext';
import type { Section } from '../types';

export interface LyricsKpis {
  sections: number;
  lines: number;
  words: number;
  characters: number;
}

/** Shared helper — lyric-only lines (excludes meta/label lines). */
const lyricLines = (sec: Section) => (sec.lines ?? []).filter(l => !l.isMeta);

/**
 * Unified KPI hook — auto-sourcé via SongContext.
 * Aucun paramètre externe nécessaire.
 */
export const useAppKpis = () => {
  const { song } = useSongContext();

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

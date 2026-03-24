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

const computeKpis = (song: Section[]) => {
  const sectionCount = song.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wordCount = song.reduce((acc, sec) =>
    acc + lyricLines(sec).reduce(
      (lAcc, line) => lAcc + (line.text ?? '').split(/\s+/).filter(Boolean).length, 0), 0);
  const charCount = song.reduce((acc, sec) =>
    acc + lyricLines(sec).reduce((lAcc, line) => lAcc + (line.text ?? '').length, 0), 0);
  const lineCount = song.reduce((acc, sec) =>
    acc + lyricLines(sec).filter(l => (l.text ?? '').trim()).length, 0);
  const lyricsKpis: LyricsKpis = { sections: sectionCount, lines: lineCount, words: wordCount, characters: charCount };
  return { sectionCount, wordCount, charCount, lineCount, lyricsKpis };
};

/**
 * Unified KPI hook.
 * - useAppKpis(song) — usage legacy, param explicite (rétrocompat App.tsx/tests)
 * - useAppKpis()    — source song via useSongContext() (usage interne composants)
 */
export function useAppKpis(song?: Section[]) {
  const ctx = useSongContext();
  const resolvedSong = song ?? ctx.song;

  const sectionCount = resolvedSong.length;

  const wordCount = useMemo(
    () => resolvedSong.reduce((acc, sec) =>
      acc + lyricLines(sec).reduce(
        (lAcc, line) => lAcc + (line.text ?? '').split(/\s+/).filter(Boolean).length, 0), 0),
    [resolvedSong]
  );

  const charCount = useMemo(
    () => resolvedSong.reduce((acc, sec) =>
      acc + lyricLines(sec).reduce((lAcc, line) => lAcc + (line.text ?? '').length, 0), 0),
    [resolvedSong]
  );

  const lineCount = useMemo(
    () => resolvedSong.reduce((acc, sec) =>
      acc + lyricLines(sec).filter(l => (l.text ?? '').trim()).length, 0),
    [resolvedSong]
  );

  const lyricsKpis: LyricsKpis = {
    sections: sectionCount,
    lines: lineCount,
    words: wordCount,
    characters: charCount,
  };

  return { sectionCount, wordCount, charCount, lineCount, lyricsKpis };
}

export { computeKpis };

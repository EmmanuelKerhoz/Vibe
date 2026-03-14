import { useMemo } from 'react';
import type { Section } from '../types';

export interface LyricsKpis {
  sections: number;
  lines: number;
  words: number;
  characters: number;
}

export function useLyricsKpis(song: Section[]): LyricsKpis {
  return useMemo(() => {
    const sections = song.length;
    const lyricLines = (sec: Section) => sec.lines.filter(l => !l.isMeta);
    const lines = song.reduce(
      (acc, s) => acc + lyricLines(s).filter(l => l.text.trim()).length,
      0,
    );
    const words = song.reduce(
      (acc, sec) =>
        acc +
        lyricLines(sec).reduce(
          (lAcc, line) =>
            lAcc + line.text.split(/\s+/).filter(Boolean).length,
          0,
        ),
      0,
    );
    const characters = song.reduce(
      (acc, sec) =>
        acc + lyricLines(sec).reduce((lAcc, line) => lAcc + line.text.length, 0),
      0,
    );

    return { sections, lines, words, characters };
  }, [song]);
}

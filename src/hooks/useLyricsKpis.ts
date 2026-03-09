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
    const lines = song.reduce(
      (acc, s) => acc + s.lines.filter(l => l.text.trim()).length,
      0,
    );
    const words = song.reduce(
      (acc, sec) =>
        acc +
        sec.lines.reduce(
          (lAcc, line) =>
            lAcc + line.text.split(/\s+/).filter(Boolean).length,
          0,
        ),
      0,
    );
    const characters = song.reduce(
      (acc, sec) =>
        acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.length, 0),
      0,
    );

    return { sections, lines, words, characters };
  }, [song]);
}

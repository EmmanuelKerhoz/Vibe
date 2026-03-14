import { useMemo } from 'react';
import type { Section } from '../types';

export const useAppKpis = (song: Section[]) => {
  const sectionCount = song.length;

  const wordCount = useMemo(
    () => song.reduce((acc, sec) =>
      acc + sec.lines
        .filter(l => !l.isMeta)
        .reduce((lAcc, line) =>
          lAcc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0), 0),
    [song]
  );

  const charCount = useMemo(
    () => song.reduce((acc, sec) =>
      acc + sec.lines
        .filter(l => !l.isMeta)
        .reduce((lAcc, line) => lAcc + line.text.length, 0), 0),
    [song]
  );

  return { sectionCount, wordCount, charCount };
};

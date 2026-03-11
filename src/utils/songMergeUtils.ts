import type { Section } from '../types';
import { cleanSectionName } from './songUtils';
import { generateId } from './idUtils';

export const mapSongWithPreservedIds = (
  newSongData: any[],
  song: Section[],
  language?: string,
): Section[] =>
  newSongData.map((s: any, idx: number) => {
    const existing = (song[idx] || {}) as any;
    return {
      ...existing,
      ...s,
      id: existing.id || generateId(),
      ...(language !== undefined ? { language } : {}),
      lines: (s.lines ?? []).map((l: any, lIdx: number) => ({
        ...l,
        id: existing.lines?.[lIdx]?.id || generateId(),
      })),
    };
  });

export const mergeAiSectionIntoCurrent = (
  currentSection: Section,
  aiSection: any,
  language?: string,
): Section => {
  const mergedName = cleanSectionName(aiSection?.name || currentSection.name);
  const mergedRhymeScheme = aiSection?.rhymeScheme || currentSection.rhymeScheme;
  const mergedLines = Array.isArray(aiSection?.lines) ? aiSection.lines : currentSection.lines;

  return {
    ...currentSection,
    ...aiSection,
    id: currentSection.id,
    name: mergedName,
    rhymeScheme: mergedRhymeScheme,
    ...(language !== undefined ? { language } : {}),
    lines: mergedLines.map((line: any, index: number) => ({
      ...(currentSection.lines[index] || {}),
      ...line,
      id: currentSection.lines[index]?.id || generateId(),
      text: line?.text ?? currentSection.lines[index]?.text ?? '',
      rhymingSyllables: line?.rhymingSyllables ?? currentSection.lines[index]?.rhymingSyllables ?? '',
      rhyme: line?.rhyme ?? currentSection.lines[index]?.rhyme ?? '',
      syllables:
        typeof line?.syllables === 'number'
          ? line.syllables
          : currentSection.lines[index]?.syllables ?? 0,
      concept: line?.concept ?? currentSection.lines[index]?.concept ?? 'New line',
    })),
  };
};

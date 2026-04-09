import type { Section, Line } from '../types';
import { isLinkedChorusSectionName } from '../constants/sections';
import { cleanSectionName } from './songUtils';
import { generateId } from './idUtils';

// Partial AI payload types — the AI returns loose JSON that we merge
// into strongly-typed Section/Line objects. Using dedicated AI types
// (instead of `any`) preserves strict typing everywhere else.
type AiLine = Partial<Line>;
type AiSection = Partial<Omit<Section, 'lines'>> & { lines?: AiLine[] };

export const mapSongWithPreservedIds = (
  newSongData: AiSection[],
  song: Section[],
  language?: string,
): Section[] =>
  newSongData.map((s, idx) => {
    const existing = song[idx] ?? ({} as Partial<Section>);
    return {
      ...existing,
      ...s,
      id: existing.id ?? generateId(),
      ...(language !== undefined ? { language } : {}),
      lines: (s.lines ?? []).map((l, lIdx) => ({
        ...l,
        id: existing.lines?.[lIdx]?.id ?? generateId(),
      })),
    } as Section;
  });

export const mergeAiSectionIntoCurrent = (
  currentSection: Section,
  aiSection: AiSection,
  language?: string,
): Section => {
  const mergedName = cleanSectionName(aiSection?.name ?? currentSection.name);
  // Use nullish coalescing: aiSection.rhymeScheme may be undefined when AI
  // omits it; fall back to currentSection.rhymeScheme which is string | undefined.
  // Conditional spread ensures the key is omitted entirely when both are undefined
  // (exactOptionalPropertyTypes compliance).
  const mergedRhymeScheme = aiSection?.rhymeScheme ?? currentSection.rhymeScheme;
  const mergedLines: AiLine[] = Array.isArray(aiSection?.lines)
    ? aiSection.lines
    : currentSection.lines;

  return {
    ...currentSection,
    ...aiSection,
    id: currentSection.id,
    name: mergedName,
    ...(mergedRhymeScheme !== undefined ? { rhymeScheme: mergedRhymeScheme } : {}),
    ...(language !== undefined ? { language } : {}),
    lines: mergedLines.map((line, index) => ({
      ...(currentSection.lines[index] ?? {}),
      ...line,
      id: currentSection.lines[index]?.id ?? generateId(),
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

export const syncLinkedChorusSections = (
  song: Section[],
  sourceSectionId?: string,
): Section[] => {
  const sourceSection = sourceSectionId
    ? song.find(section => section.id === sourceSectionId)
    : song.find(section => isLinkedChorusSectionName(section.name));

  if (!sourceSection || !isLinkedChorusSectionName(sourceSection.name)) return song;

  return song.map(section => {
    if (!isLinkedChorusSectionName(section.name) || section.id === sourceSection.id) return section;
    return mergeAiSectionIntoCurrent(section, { ...sourceSection, name: section.name });
  });
};

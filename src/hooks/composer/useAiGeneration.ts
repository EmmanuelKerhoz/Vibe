import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Type } from '@google/genai';
import type { Section } from '../../types';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { cleanSectionName } from '../../utils/songUtils';
import { isPureMetaLine } from '../../utils/metaUtils';
import { generateId } from '../../utils/idUtils';
import { mapSongWithPreservedIds, mergeAiSectionIntoCurrent } from '../../utils/songMergeUtils';
import { makeSongUpdater } from '../hookUtils';
import { withAbort, isAbortError } from '../../utils/withAbort';
import { withRetry } from '../../utils/withRetry';

const SHORT_SECTION_LINE_COUNT = 4;
const LONG_SECTION_LINE_COUNT = 6;

const getDefaultLineCount = (name: string) =>
  name.toLowerCase().includes('verse') || name.toLowerCase().includes('bridge')
    ? LONG_SECTION_LINE_COUNT
    : SHORT_SECTION_LINE_COUNT;

const sectionNamesMatch = (left: string, right: string) => left.toLowerCase() === right.toLowerCase();

const createEmptySection = (name: string, defaultRhymeScheme: string): Section => ({
  id: generateId(),
  name,
  rhymeScheme: defaultRhymeScheme,
  lines: Array(getDefaultLineCount(name))
    .fill(null)
    .map(() => ({
      id: generateId(),
      text: '',
      rhymingSyllables: '',
      rhyme: '',
      syllables: 0,
      concept: 'New line',
    })),
});

const alignGeneratedSongToStructure = (
  generatedSong: Section[],
  structure: string[],
  defaultRhymeScheme: string,
): Section[] => {
  const remainingSections = [...generatedSong];
  return structure.map(sectionName => {
    const matchingIndex = remainingSections.findIndex(section =>
      sectionNamesMatch(section.name, sectionName),
    );
    let matchedSection: Section | undefined;
    if (matchingIndex === -1) {
      matchedSection = remainingSections.length > 0 ? remainingSections.shift() : undefined;
    } else {
      matchedSection = remainingSections.splice(matchingIndex, 1)[0];
    }
    return matchedSection
      ? { ...matchedSection, name: sectionName }
      : createEmptySection(sectionName, defaultRhymeScheme);
  });
};

/** Flags isMeta on lines returned by the AI generator */
const flagMetaLines = (lines: any[]): any[] =>
  lines.map(line => ({
    ...line,
    isMeta: isPureMetaLine(line.text ?? ''),
  }));

const META_INSTRUCTION_HINT = `You may include performance/production meta-instructions on their own line using square brackets, e.g. [Guitar solo], [Whispered], [Anthemic], [Ad-lib], [Key change]. These are NOT section headers — they are preserved and displayed as special directives in the song editor.`;

const GENERATION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      rhymeScheme: {
        type: Type.STRING,
        description: 'The rhyme scheme for this section, e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE',
      },
      lines: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            rhymingSyllables: { type: Type.STRING },
            rhyme: { type: Type.STRING },
            syllables: { type: Type.INTEGER },
            concept: { type: Type.STRING },
          },
          required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
        },
      },
    },
    required: ['name', 'lines', 'rhymeScheme'],
  },
} as const;

type UseAiGenerationParams = {
  song: Section[];
  structure: string[];
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  title: string;
  songLanguage: string;
  uiLanguage: string;
  updateState: (
    recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] },
  ) => void;
  updateSongWithHistory: (newSong: Section[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  requestAutoTitleGeneration: () => void;
  setSelectedLineId: (id: string | null) => void;
};

export const useAiGeneration = ({
  song,
  structure,
  topic,
  mood,
  rhymeScheme,
  targetSyllables,
  title,
  songLanguage,
  uiLanguage,
  updateState,
  updateSongWithHistory,
  updateSongAndStructureWithHistory,
  requestAutoTitleGeneration,
  setSelectedLineId,
}: UseAiGenerationParams) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSections, setRegeneratingSections] = useState<Set<string>>(new Set());

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const isRegeneratingSection = useCallback(
    (sectionId: string) => regeneratingSections.has(sectionId),
    [regeneratingSections],
  );

  // Stable — ne change que si updateState change
  const updateSong = useMemo(() => makeSongUpdater(updateState), [updateState]);

  // ── generateSong ──────────────────────────────────────────────────── P4-fix: useCallback
  const generateSong = useCallback(async () => {
    setIsGenerating(true);
    try {
      await withAbort(abortControllerRef, async (signal) => {
        const lang = songLanguage || 'English';
        const prompt = `Write a song about "${topic}".\nMood: ${mood}\nDefault Rhyme Scheme: ${rhymeScheme}\nTarget Syllables per line: ${targetSyllables}\nStructure: ${structure.join(', ')}\n\nIMPORTANT: Write ALL lyrics in ${lang}. You MUST follow the provided structure EXACTLY. Generate exactly the sections listed in the Structure field, in that specific order.\n\n${META_INSTRUCTION_HINT}\n\nLine counts for sections:\n- Intro: 4 lines\n- Verse: 6 lines\n- Chorus: 4 lines\n- Bridge: 6 lines\n- Outro: 4 lines\n\nFor each section, provide a rhyme scheme (e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE).\nFor each line, provide the lyric text (in ${lang}), the rhyming syllables, the rhyme identifier, the exact syllable count, and a short core concept (in ${uiLanguage}).`;

        const response = await withRetry(() =>
          getAi().models.generateContent({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: GENERATION_SCHEMA },
            signal,
          })
        );

        const data = safeJsonParse(response.text || '[]', []);
        const songWithIds = data.map((section: any) => ({
          ...section,
          name: cleanSectionName(section.name),
          id: generateId(),
          rhymeScheme: section.rhymeScheme || rhymeScheme,
          lines: flagMetaLines(section.lines).map((line: any) => ({ ...line, id: generateId() })),
        }));
        const orderedSong = alignGeneratedSongToStructure(songWithIds, structure, rhymeScheme);
        updateSongAndStructureWithHistory(orderedSong, structure);
        requestAutoTitleGeneration();
        setSelectedLineId(null);
      });
    } catch (error: any) {
      if (isAbortError(error)) return;
      handleApiError(error, 'Failed to generate song. Please try again.');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) setIsGenerating(false);
    }
  }, [
    song, structure, topic, mood, rhymeScheme, targetSyllables, songLanguage, uiLanguage,
    updateSongAndStructureWithHistory, requestAutoTitleGeneration, setSelectedLineId,
  ]);

  // ── regenerateSection ───────────────────────────────────────────── P4-fix: useCallback
  const regenerateSection = useCallback(async (sectionId: string) => {
    const sectionToRegenerate = song.find(s => s.id === sectionId);
    if (!sectionToRegenerate) return;

    setRegeneratingSections(prev => new Set(prev).add(sectionId));
    try {
      await withAbort(abortControllerRef, async (signal) => {
        const sectionIndex = song.findIndex(s => s.id === sectionId);
        const prevSection = sectionIndex > 0 ? song[sectionIndex - 1] : null;
        const nextSection = sectionIndex < song.length - 1 ? song[sectionIndex + 1] : null;

        let lineCountPrompt = '';
        const lowerName = sectionToRegenerate.name.toLowerCase();
        if (lowerName.includes('intro'))  lineCountPrompt = 'The section should have exactly 4 lines.';
        else if (lowerName.includes('verse'))  lineCountPrompt = 'The section should have exactly 6 lines.';
        else if (lowerName.includes('chorus')) lineCountPrompt = 'The section should have exactly 4 lines.';
        else if (lowerName.includes('bridge')) lineCountPrompt = 'The section should have exactly 6 lines.';
        else if (lowerName.includes('outro'))  lineCountPrompt = 'The section should have exactly 4 lines.';

        const songStructure = song.map(s => s.name).join(' \u2192 ');
        const lang = songLanguage || 'English';
        const formatSectionLyrics = (sec: Section) =>
          sec.lines.map(l => l.text).filter(Boolean).join('\n');

        const prevContext = prevSection
          ? `\nPrevious section context (${prevSection.name}):\n${formatSectionLyrics(prevSection)}`
          : '';
        const nextContext = nextSection
          ? `\nNext section context (${nextSection.name}):\n${formatSectionLyrics(nextSection)}`
          : '';

        const creativeDirectives = [
          ...(sectionToRegenerate.preInstructions || []),
          ...(sectionToRegenerate.postInstructions || []),
        ];
        const directivesPrompt = creativeDirectives.length > 0
          ? `\nCreative directives:\n${creativeDirectives.map(d => `- ${d}`).join('\n')}`
          : '';

        const prompt = `Rewrite the following section of a song titled "${title}" about "${topic}".\nMood: ${mood}\nTarget Syllables per line: ${targetSyllables}\nSection Name: ${sectionToRegenerate.name}\nRhyme Scheme: ${sectionToRegenerate.rhymeScheme || rhymeScheme}\n${lineCountPrompt}\nSong structure: ${songStructure}\n${prevContext}${nextContext}${directivesPrompt}\n\n${META_INSTRUCTION_HINT}\n\nIMPORTANT: Write ALL lyrics in ${lang}. Concepts may be written in ${uiLanguage}.\n\nCurrent Section:\n${JSON.stringify([sectionToRegenerate], null, 2)}\n\nProvide a new creative version of this section that fits seamlessly with the surrounding sections.\nReturn the updated section in the exact same JSON structure (as an array with one section).`;

        const response = await withRetry(() =>
          getAi().models.generateContent({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: GENERATION_SCHEMA },
            signal,
          })
        );

        const data = safeJsonParse<Section[]>(response.text || '[]', []);
        const firstSection = data[0];
        if (firstSection) {
          const patchedSection = { ...firstSection, lines: flagMetaLines(firstSection.lines ?? []) };
          updateSong(currentSong =>
            currentSong.map(section =>
              section.id !== sectionId ? section : mergeAiSectionIntoCurrent(section, patchedSection)
            )
          );
        }
      });
    } catch (error: any) {
      if (isAbortError(error)) return;
      handleApiError(error, 'Failed to regenerate section. Please try again.');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setRegeneratingSections(prev => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
      }
    }
  }, [
    song, title, topic, mood, rhymeScheme, targetSyllables, songLanguage, uiLanguage,
    updateSong,
  ]);

  // ── quantizeSyllables ──────────────────────────────────────────── P4-fix: useCallback
  const quantizeSyllables = useCallback(async (sectionId?: string) => {
    if (song.length === 0) return;
    setIsGenerating(true);
    const lang = songLanguage || 'English';

    try {
      await withAbort(abortControllerRef, async (signal) => {
        let prompt = '';
        if (sectionId) {
          const sectionToQuantize = song.find(s => s.id === sectionId);
          if (!sectionToQuantize) return;
          const syllables = sectionToQuantize.targetSyllables ?? targetSyllables;
          prompt = `Rewrite the following section of a song so that EVERY line has EXACTLY ${syllables} syllables. Maintain the original meaning, rhyme scheme, and section structure.\nWrite ALL lyrics in ${lang}.\nPreserve any meta-instruction lines (e.g. [Guitar solo]) verbatim without counting them toward syllable targets.\n\nCurrent Section:\n${JSON.stringify([sectionToQuantize], null, 2)}\n\nReturn the updated section in the exact same JSON structure (as an array with one section).`;
        } else {
          prompt = `Rewrite the following song so that EVERY line has EXACTLY the number of syllables specified by its section's targetSyllables (or ${targetSyllables} if not specified). Maintain the original meaning, rhyme scheme (respecting section-level schemes if specified), and section structure.\nWrite ALL lyrics in ${lang}.\nPreserve any meta-instruction lines (e.g. [Guitar solo]) verbatim without counting them toward syllable targets.\n\nCurrent Song:\n${JSON.stringify(song, null, 2)}\n\nReturn the updated song in the exact same JSON structure.`;
        }

        const response = await withRetry(() =>
          getAi().models.generateContent({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: GENERATION_SCHEMA },
            signal,
          })
        );

        const data = safeJsonParse<Section[]>(response.text || '[]', []);

        if (sectionId) {
          const firstSection = data[0];
          if (firstSection) {
            const patchedSection = { ...firstSection, lines: flagMetaLines(firstSection.lines ?? []) };
            updateSong(currentSong =>
              currentSong.map(section =>
                section.id !== sectionId ? section : mergeAiSectionIntoCurrent(section, patchedSection)
              )
            );
          }
        } else {
          const updatedSong = mapSongWithPreservedIds(data, song);
          const reflagged = updatedSong.map(sec => ({ ...sec, lines: flagMetaLines(sec.lines) }));
          updateSongWithHistory(reflagged);
        }
      });
    } catch (error: any) {
      if (isAbortError(error)) return;
      handleApiError(error, 'Failed to quantize syllables. Please try again.');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) setIsGenerating(false);
    }
  }, [
    song, targetSyllables, songLanguage, updateSong, updateSongWithHistory,
  ]);

  return {
    isGenerating,
    isRegeneratingSection,
    generateSong,
    regenerateSection,
    quantizeSyllables,
  };
};

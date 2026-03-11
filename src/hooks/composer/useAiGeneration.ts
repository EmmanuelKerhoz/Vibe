import { useState, useCallback } from 'react';
import { Type } from '@google/genai';
import type { Section } from '../../types';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { cleanSectionName } from '../../utils/songUtils';
import { generateId } from '../../utils/idUtils';
import { mapSongWithPreservedIds, mergeAiSectionIntoCurrent } from '../../utils/songMergeUtils';

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

  const isRegeneratingSection = useCallback(
    (sectionId: string) => regeneratingSections.has(sectionId),
    [regeneratingSections],
  );

  const updateSong = (transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({
      song: transform(current.song),
      structure: current.structure,
    }));
  };

  const generateSong = async () => {
    setIsGenerating(true);
    try {
      const lang = songLanguage || 'English';
      const prompt = `Write a song about "${topic}".
Mood: ${mood}
Default Rhyme Scheme: ${rhymeScheme}
Target Syllables per line: ${targetSyllables}
Structure: ${structure.join(', ')}

IMPORTANT: Write ALL lyrics in ${lang}. You MUST follow the provided structure EXACTLY. Generate exactly the sections listed in the Structure field, in that specific order.

Line counts for sections:
- Intro: 4 lines
- Verse: 6 lines
- Chorus: 4 lines
- Bridge: 6 lines
- Outro: 4 lines

For each section, provide a rhyme scheme (e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE).
For each line, provide the lyric text (in ${lang}), the rhyming syllables, the rhyme identifier, the exact syllable count, and a short core concept (in ${uiLanguage}).`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: {
                  type: Type.STRING,
                  description:
                    'The rhyme scheme for this section, e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE',
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
          },
        },
      });

      const data = safeJsonParse(response.text || '[]', []);
      const songWithIds = data.map((section: any) => ({
        ...section,
        name: cleanSectionName(section.name),
        id: generateId(),
        rhymeScheme: section.rhymeScheme || rhymeScheme,
        lines: section.lines.map((line: any) => ({
          ...line,
          id: generateId(),
        })),
      }));
      const orderedSong = alignGeneratedSongToStructure(songWithIds, structure, rhymeScheme);
      updateSongAndStructureWithHistory(orderedSong, structure);
      requestAutoTitleGeneration();
      setSelectedLineId(null);
    } catch (error: any) {
      handleApiError(error, 'Failed to generate song. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateSection = async (sectionId: string) => {
    const sectionToRegenerate = song.find(s => s.id === sectionId);
    if (!sectionToRegenerate) return;

    setRegeneratingSections(prev => new Set(prev).add(sectionId));
    try {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      const prevSection = sectionIndex > 0 ? song[sectionIndex - 1] : null;
      const nextSection = sectionIndex < song.length - 1 ? song[sectionIndex + 1] : null;

      let lineCountPrompt = '';
      const lowerName = sectionToRegenerate.name.toLowerCase();
      if (lowerName.includes('intro')) lineCountPrompt = 'The section should have exactly 4 lines.';
      else if (lowerName.includes('verse')) lineCountPrompt = 'The section should have exactly 6 lines.';
      else if (lowerName.includes('chorus')) lineCountPrompt = 'The section should have exactly 4 lines.';
      else if (lowerName.includes('bridge')) lineCountPrompt = 'The section should have exactly 6 lines.';
      else if (lowerName.includes('outro')) lineCountPrompt = 'The section should have exactly 4 lines.';

      const songStructure = song.map(s => s.name).join(' → ');
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
      const directivesPrompt =
        creativeDirectives.length > 0
          ? `\nCreative directives:\n${creativeDirectives.map(d => `- ${d}`).join('\n')}`
          : '';

      const prompt = `Rewrite the following section of a song titled "${title}" about "${topic}".
Mood: ${mood}
Target Syllables per line: ${targetSyllables}
Section Name: ${sectionToRegenerate.name}
Rhyme Scheme: ${sectionToRegenerate.rhymeScheme || rhymeScheme}
${lineCountPrompt}
Song structure: ${songStructure}
${prevContext}${nextContext}${directivesPrompt}

IMPORTANT: Write ALL lyrics in ${lang}. Concepts may be written in ${uiLanguage}.

Current Section:
${JSON.stringify([sectionToRegenerate], null, 2)}

Provide a new creative version of this section that fits seamlessly with the surrounding sections.
Return the updated section in the exact same JSON structure (as an array with one section).`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING, description: 'The rhyme scheme for this section' },
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
          },
        },
      });

      const data = safeJsonParse(response.text || '[]', []);
      if (data.length > 0) {
        updateSong(currentSong =>
          currentSong.map(section => {
            if (section.id !== sectionId) return section;
            return mergeAiSectionIntoCurrent(section, data[0]);
          }),
        );
      }
    } catch (error: any) {
      handleApiError(error, 'Failed to regenerate section. Please try again.');
    } finally {
      setRegeneratingSections(prev => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }
  };

  const quantizeSyllables = async (sectionId?: string) => {
    if (song.length === 0) return;
    setIsGenerating(true);
    const lang = songLanguage || 'English';
    try {
      let prompt = '';
      if (sectionId) {
        const sectionToQuantize = song.find(s => s.id === sectionId);
        if (!sectionToQuantize) return;
        const syllables = sectionToQuantize.targetSyllables ?? targetSyllables;
        prompt = `Rewrite the following section of a song so that EVERY line has EXACTLY ${syllables} syllables. Maintain the original meaning, rhyme scheme, and section structure.
Write ALL lyrics in ${lang}.

Current Section:
${JSON.stringify([sectionToQuantize], null, 2)}

Return the updated section in the exact same JSON structure (as an array with one section).`;
      } else {
        prompt = `Rewrite the following song so that EVERY line has EXACTLY the number of syllables specified by its section's targetSyllables (or ${targetSyllables} if not specified). Maintain the original meaning, rhyme scheme (respecting section-level schemes if specified), and section structure.
Write ALL lyrics in ${lang}.

Current Song:
${JSON.stringify(song, null, 2)}

Return the updated song in the exact same JSON structure.`;
      }

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING, description: 'The rhyme scheme for this section' },
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
          },
        },
      });

      const data = safeJsonParse(response.text || '[]', []);

      if (sectionId) {
        if (data.length > 0) {
          updateSong(currentSong =>
            currentSong.map(section => {
              if (section.id !== sectionId) return section;
              return mergeAiSectionIntoCurrent(section, data[0]);
            }),
          );
        }
      } else {
        const updatedSong = mapSongWithPreservedIds(data, song);
        updateSongWithHistory(updatedSong);
      }
    } catch (error: any) {
      handleApiError(error, 'Failed to quantize syllables. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    isRegeneratingSection,
    generateSong,
    regenerateSection,
    quantizeSyllables,
  };
};

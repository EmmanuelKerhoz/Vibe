import { useState, useCallback } from 'react';
import { Type } from '@google/genai';
import type { Line, Section } from '../../types';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { buildRhymeConstrainedPrompt } from '../../utils/promptUtils';
import { countSyllables } from '../../utils/syllableUtils';

const computeSyllables = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc, word) => acc + countSyllables(word), 0);

type UseSuggestionsParams = {
  song: Section[];
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  songLanguage: string;
  selectedLineId: string | null;
  updateState: (
    recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] },
  ) => void;
};

export const useSuggestions = ({
  song,
  topic,
  mood,
  rhymeScheme,
  targetSyllables,
  songLanguage,
  selectedLineId,
  updateState,
}: UseSuggestionsParams) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const updateSong = useCallback(
    (transform: (currentSong: Section[]) => Section[]) => {
      updateState(current => ({
        song: transform(current.song),
        structure: current.structure,
      }));
    },
    [updateState],
  );

  const generateSuggestions = useCallback(
    async (lineId: string) => {
      setIsSuggesting(true);
      setSuggestions([]);

      let currentLine: Line | null = null;
      let previousLine: Line | null = null;
      let nextLine: Line | null = null;
      let sectionName = '';
      let currentSection: Section | null = null;

      for (let s = 0; s < song.length; s++) {
        const section = song[s]!;
        for (let l = 0; l < section.lines.length; l++) {
          if (section.lines[l]!.id === lineId) {
            currentLine = section.lines[l]!;
            currentSection = section;
            sectionName = section.name;
            if (l > 0) previousLine = section.lines[l - 1]!;
            if (l < section.lines.length - 1) nextLine = section.lines[l + 1]!;
            break;
          }
        }
        if (currentLine) break;
      }

      if (!currentLine || !currentSection) {
        setIsSuggesting(false);
        return;
      }

      const lang = songLanguage || 'English';
      try {
        // Build IPA-enhanced prompt if section has language and existing lines with rhymes
        const langCode = currentSection.language || songLanguage;
        const hasRhymedLines = currentSection.lines.some(line =>
          line.rhyme && line.rhyme !== '' && line.rhyme !== 'FREE' && !line.isMeta
        );
        let ipaConstraints = '';
        if (langCode && hasRhymedLines && currentLine.rhyme && currentLine.rhyme !== '' && currentLine.rhyme !== 'FREE') {
          try {
            const enrichedPrompt = await buildRhymeConstrainedPrompt(
              currentSection.lines,
              langCode,
              currentSection.rhymeScheme || rhymeScheme
            );
            // Extract just the IPA constraints portion to append
            if (enrichedPrompt.includes('PHONEMIC RHYME CONSTRAINTS:')) {
              ipaConstraints = '\n\n' + enrichedPrompt.substring(
                enrichedPrompt.indexOf('PHONEMIC RHYME CONSTRAINTS:')
              );
            }
          } catch (error) {
            console.debug('Failed to build IPA-enhanced prompt, continuing without:', error);
          }
        }

        const prompt = `Generate 3 creative alternative versions for a lyric line.
Context:
- Topic: ${topic}
- Mood: ${mood}
- Rhyme Scheme: ${song.find(s => s.lines.some(l => l.id === lineId))?.rhymeScheme || rhymeScheme}
- Target Syllables: ${targetSyllables}
- Section: ${sectionName}
- Previous Line: "${previousLine?.text || ''}" (Rhyme: ${previousLine?.rhyme || ''})
- Current Line to replace: "${currentLine.text}" (Rhyme: ${currentLine.rhyme}, Concept: ${currentLine.concept})
- Next Line: "${nextLine?.text || ''}" (Rhyme: ${nextLine?.rhyme || ''})${ipaConstraints}

IMPORTANT: All 3 alternatives MUST be written in ${lang}.
Provide exactly 3 alternative lines that fit the context, mood, and rhyme scheme. Return them as a JSON array of strings.`;

        const response = await getAi().models.generateContent({
          model: AI_MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        });

        const data = safeJsonParse(response.text || '[]', []);
        setSuggestions(data);
      } catch (error) {
        handleApiError(error, 'Failed to generate suggestions.');
      } finally {
        setIsSuggesting(false);
      }
    },
    [song, topic, mood, rhymeScheme, targetSyllables, songLanguage],
  );

  const applySuggestion = useCallback(
    (newText: string) => {
      if (!selectedLineId) return;
      updateSong(currentSong =>
        currentSong.map(section => ({
          ...section,
          lines: section.lines.map(line => {
            if (line.id === selectedLineId) {
              return { ...line, text: newText, syllables: computeSyllables(newText), isManual: true };
            }
            return line;
          }),
        })),
      );
    },
    [selectedLineId, updateSong],
  );

  return {
    suggestions,
    isSuggesting,
    setSuggestions,
    generateSuggestions,
    applySuggestion,
  };
};

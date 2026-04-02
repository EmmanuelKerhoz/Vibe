import { useState, useCallback, useEffect, useRef } from 'react';
import { Type } from '@google/genai';
import type { Line, Section } from '../../types';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { buildRhymeConstrainedPrompt } from '../../utils/promptUtils';
import { countSyllables } from '../../utils/syllableUtils';
import { withAbort, isAbortError } from '../../utils/withAbort';

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
  songLanguage?: string;
  hasApiKey: boolean;
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
  songLanguage = '',
  hasApiKey,
  selectedLineId,
  updateState,
}: UseSuggestionsParams) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

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
      if (!hasApiKey) return;

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
      const exclusiveLanguageInstruction = songLanguage.trim()
        ? `Write exclusively in ${songLanguage.trim()}.`
        : '';
      let wasAborted = false;
      try {
        await withAbort(abortControllerRef, async (nextSignal) => {
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
${exclusiveLanguageInstruction ? `${exclusiveLanguageInstruction}\n` : ''}Provide exactly 3 alternative lines that fit the context, mood, and rhyme scheme. Return them as a JSON array of strings.`;

          const response = await generateContentWithRetry({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            signal: nextSignal,
          });

          if (nextSignal.aborted) {
            wasAborted = true;
            return;
          }
          setSuggestions(safeJsonParse(response.text || '[]', []));
        });
      } catch (error) {
        if (isAbortError(error)) {
          wasAborted = true;
          return;
        }
        handleApiError(error, 'Failed to generate suggestions.');
      } finally {
        if (!wasAborted) setIsSuggesting(false);
      }
    },
    [song, topic, mood, rhymeScheme, targetSyllables, songLanguage, hasApiKey],
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

type UseSynonymsParams = {
  song: Section[];
  songLanguage?: string;
  hasApiKey: boolean;
};

export const useSynonyms = ({
  song,
  songLanguage = 'English',
  hasApiKey,
}: UseSynonymsParams) => {
  const [synonyms, setSynonyms] = useState<Record<string, string[]> | null>(null);
  const [isSynonymsLoading, setIsSynonymsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generateSynonyms = useCallback(
    async (lineId: string) => {
      if (!hasApiKey) return;

      setIsSynonymsLoading(true);
      setSynonyms(null);

      let currentLine: Line | null = null;
      for (const section of song) {
        for (const line of section.lines) {
          if (line.id === lineId) { currentLine = line; break; }
        }
        if (currentLine) break;
      }

      if (!currentLine) { setIsSynonymsLoading(false); return; }

      const lang = songLanguage.trim() || 'English';
      const prompt = `You are a specialist in ${lang} lyrics and poetic vocabulary.

For each word in the lyric line below, suggest up to 3 synonyms or near-synonyms that:
- Have the SAME number of syllables as the original word (strict constraint — count carefully)
- Fit naturally in the same position in the line
- Match the emotional tone of the original

Line: "${currentLine.text}"

Return a JSON object where each key is a word from the line and the value is an array of synonym strings.
Words with no valid same-syllable synonym should be omitted entirely.
Return ONLY the JSON object, no markdown.`;

      let wasAborted = false;
      try {
        await withAbort(abortRef, async (signal) => {
          const response = await generateContentWithRetry({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                additionalProperties: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
            signal,
          });
          if (signal.aborted) { wasAborted = true; return; }
          const parsed = safeJsonParse<Record<string, string[]>>(response.text || '{}', {});
          setSynonyms(Object.keys(parsed).length ? parsed : null);
        });
      } catch (error) {
        if (isAbortError(error)) { wasAborted = true; return; }
        handleApiError(error, 'Failed to generate synonyms.');
      } finally {
        if (!wasAborted) setIsSynonymsLoading(false);
      }
    },
    [song, songLanguage, hasApiKey],
  );

  const clearSynonyms = useCallback(() => setSynonyms(null), []);

  return { synonyms, isSynonymsLoading, generateSynonyms, clearSynonyms };
};

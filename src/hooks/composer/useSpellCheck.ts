import { useState, useCallback, useRef } from 'react';
import { Type } from '@google/genai';
import type { Line, Section } from '../../types';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { withAbort, isAbortError } from '../../utils/withAbort';

type UseSpellCheckParams = {
  song: Section[];
  songLanguage?: string;
  hasApiKey: boolean;
  selectedLineId: string | null;
  updateState: (
    recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] },
  ) => void;
};

export type UseSpellCheckReturn = ReturnType<typeof useSpellCheck>;

export const useSpellCheck = ({
  song,
  songLanguage = 'English',
  hasApiKey,
  selectedLineId,
  updateState,
}: UseSpellCheckParams) => {
  const [correction, setCorrection] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkSpelling = useCallback(
    async (lineId: string) => {
      if (!hasApiKey) return;

      setIsChecking(true);
      setCorrection(null);

      let currentLine: Line | null = null;

      for (const section of song) {
        for (const line of section.lines) {
          if (line.id === lineId) { currentLine = line; break; }
        }
        if (currentLine) break;
      }

      if (!currentLine) { setIsChecking(false); return; }

      const lang = songLanguage.trim() || 'English';
      const syllableCount = currentLine.syllables ?? 0;
      const prompt = `You are a meticulous lyric proofreader for ${lang} lyrics.

Fix ONLY genuine spelling errors in the following lyric line.
Preserve: the exact number of syllables (${syllableCount}), all rhyme sounds, capitalisation style, poetic contractions, and deliberate vernacular (e.g. "gonna", "ain't").
Do NOT rephrase, add or remove words unless strictly required by a spelling fix.

Line: "${currentLine.text}"

Return a JSON object with a single key "corrected" whose value is the corrected line string.
If there are no errors, return the line unchanged.`;

      let wasAborted = false;
      try {
        await withAbort(abortControllerRef, async (signal) => {
          const response = await generateContentWithRetry({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: { corrected: { type: Type.STRING } },
                required: ['corrected'],
              },
            },
            signal,
          });

          if (signal.aborted) { wasAborted = true; return; }

          const parsed = safeJsonParse<{ corrected: string }>(response.text || '{}', { corrected: '' });
          const fixed = parsed.corrected || currentLine!.text;
          setCorrection(fixed === currentLine!.text ? null : fixed);
        });
      } catch (error) {
        if (isAbortError(error)) { wasAborted = true; return; }
        handleApiError(error, 'Spell-check failed.');
      } finally {
        if (!wasAborted) setIsChecking(false);
      }
    },
    [song, songLanguage, hasApiKey],
  );

  const applyCorrection = useCallback(
    (correctedText: string) => {
      if (!selectedLineId) return;
      updateState(current => ({
        structure: current.structure,
        song: current.song.map(section => ({
          ...section,
          lines: section.lines.map(line =>
            line.id === selectedLineId
              ? { ...line, text: correctedText, isManual: true }
              : line,
          ),
        })),
      }));
      setCorrection(null);
    },
    [selectedLineId, updateState],
  );

  const dismissCorrection = useCallback(() => setCorrection(null), []);

  return { correction, isChecking, checkSpelling, applyCorrection, dismissCorrection };
};

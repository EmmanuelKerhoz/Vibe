import { useState, useEffect, useRef } from 'react';
import { AI_MODEL_NAME, generateContentWithRetry, handleApiError } from '../utils/aiUtils';
import type { Section } from '../types';
import { getSongText } from '../utils/songUtils';
import { withAbort, isAbortError } from '../utils/withAbort';

export function useTitleGenerator(
  song: Section[],
  topic: string,
  mood: string,
  songLanguage: string = 'English',
) {
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  const generateTitle = async (): Promise<string | null> => {
    if (song.length === 0) return null;

    setIsGeneratingTitle(true);
    let wasAborted = false;
    try {
      return await withAbort(abortControllerRef, async (nextSignal) => {
        const lyricsSnippet = getSongText(song.slice(0, 2)).substring(0, 500);

        const prompt = `Generate a creative, concise song title (max 6 words) based on:
Topic: ${topic}
Mood: ${mood}
Lyrics excerpt:
${lyricsSnippet}

IMPORTANT: The title MUST be written in ${songLanguage}.
Return ONLY the title as plain text, no quotes, no explanation.`;

        const response = await generateContentWithRetry({
          model: AI_MODEL_NAME,
          contents: prompt,
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return null;
        }
        return response.text?.trim() || null;
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return null;
      }
      handleApiError(error, 'Failed to generate title');
      return null;
    } finally {
      if (!wasAborted) setIsGeneratingTitle(false);
    }
  };

  return { generateTitle, isGeneratingTitle };
}

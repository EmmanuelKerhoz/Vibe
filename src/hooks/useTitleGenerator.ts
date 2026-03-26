import { useState, useEffect, useRef, useCallback } from 'react';
import { AI_MODEL_NAME, generateContentWithRetry, handleApiError } from '../utils/aiUtils';
import { getSongText } from '../utils/songUtils';
import { withAbort, isAbortError } from '../utils/withAbort';
import { useSongHistoryContext } from '../contexts/SongHistoryContext';
import { useSongMetaContext } from '../contexts/SongMetaContext';

export function useTitleGenerator() {
  const {
    topic,
    mood,
    songLanguage,
    shouldAutoGenerateTitle,
    setShouldAutoGenerateTitle,
    setTitle,
    setTitleOrigin,
  } = useSongMetaContext();
  const { song } = useSongHistoryContext();
  const songLength = song.length;
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  const generateTitle = useCallback(async (): Promise<string | null> => {
    if (song.length === 0) return null;

    setIsGeneratingTitle(true);
    let wasAborted = false;
    try {
      return await withAbort(abortControllerRef, async (nextSignal) => {
        const lyricsSnippet = getSongText(song.slice(0, 2)).substring(0, 500);
        const languageInstruction = songLanguage.trim()
          ? `IMPORTANT: Respond exclusively in ${songLanguage.trim()}. The title MUST be written in that language.\n`
          : '';

        const prompt = `Generate a creative, concise song title (max 6 words) based on:
Topic: ${topic}
Mood: ${mood}
Lyrics excerpt:
${lyricsSnippet}

${languageInstruction}Return ONLY the title as plain text, no quotes, no explanation.`;

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
  }, [mood, song, songLanguage, topic]);

  useEffect(() => {
    if (shouldAutoGenerateTitle === undefined) return;
    if (!shouldAutoGenerateTitle || songLength === 0 || !setTitle || !setTitleOrigin || !setShouldAutoGenerateTitle) return;
    let isCancelled = false;
    const run = async () => {
      const newTitle = await generateTitle();
      if (!isCancelled && newTitle) {
        setTitle(newTitle);
        setTitleOrigin('ai');
      }
      if (!isCancelled) setShouldAutoGenerateTitle(false);
    };
    void run();
    return () => { isCancelled = true; };
  }, [generateTitle, setShouldAutoGenerateTitle, setTitle, setTitleOrigin, shouldAutoGenerateTitle, songLength]);

  return { generateTitle, isGeneratingTitle };
}

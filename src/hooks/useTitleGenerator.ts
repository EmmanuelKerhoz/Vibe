import { useState, useEffect, useRef, useCallback } from 'react';
import { AI_MODEL_NAME, generateContentWithRetry, handleApiError } from '../utils/aiUtils';
import { getSongText } from '../utils/songUtils';
import { withAbort, isAbortError } from '../utils/withAbort';
import { useSongContext } from '../contexts/SongContext';
import { UNTRUSTED_INPUT_PREAMBLE, fence, fenceLong } from '../utils/promptSanitization';

export function useTitleGenerator() {
  const {
    song,
    topic,
    mood,
    songLanguage,
    shouldAutoGenerateTitle,
    setShouldAutoGenerateTitle,
    setTitle,
    setTitleOrigin,
  } = useSongContext();
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
        const safeLang = songLanguage.trim();
        const languageInstruction = safeLang
          ? `IMPORTANT: Respond exclusively in ${fence('SONG_LANGUAGE', safeLang, { maxLength: 64 })}. The title MUST be written in that language.\n`
          : '';

        const prompt = `${UNTRUSTED_INPUT_PREAMBLE}

Generate a creative, concise song title (max 6 words) based on:
${fence('TOPIC', topic)}
${fence('MOOD', mood)}
${fenceLong('LYRICS_EXCERPT', lyricsSnippet)}

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
        // Guard: response.text must be a non-empty string (already guaranteed by
        // GenerateContentResponseSchema in proxyGenerateContent, but defensive here
        // in case the call path is mocked or the schema is relaxed in future).
        const title = typeof response.text === 'string' ? response.text.trim() : '';
        return title.length > 0 ? title : null;
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

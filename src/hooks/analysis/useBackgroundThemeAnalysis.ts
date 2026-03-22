import { useEffect, useRef, useState } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, generateContentWithRetry, handleApiError, safeJsonParse } from '../../utils/aiUtils';
import { buildThemeAnalysisPrompt } from '../../utils/promptUtils';
import type { Section } from '../../types';
import { abortCurrent, isAbortError, withAbort } from '../../utils/withAbort';

type UseBackgroundThemeAnalysisParams = {
  song: Section[];
  topic: string;
  mood: string;
  uiLanguage?: string;
  setTopic: (v: string) => void;
  setMood: (v: string) => void;
};

export const useBackgroundThemeAnalysis = ({
  song,
  topic,
  mood,
  uiLanguage = '',
  setTopic,
  setMood,
}: UseBackgroundThemeAnalysisParams): { isAnalyzingTheme: boolean } => {
  const [isAnalyzingTheme, setIsAnalyzingTheme] = useState(false);
  const lastAnalyzedSongRef = useRef('');
  const backoffUntilRef = useRef(0);
  const bgAbortControllerRef = useRef<AbortController | null>(null);
  const isAnalyzingThemeRef = useRef(false);

  useEffect(() => {
    return () => {
      abortCurrent(bgAbortControllerRef);
    };
  }, []);

  useEffect(() => {
    if (song.length === 0) return;

    const currentSongStr = JSON.stringify(song);
    if (currentSongStr === lastAnalyzedSongRef.current) return;

    const timer = setTimeout(async () => {
      if (Date.now() < backoffUntilRef.current) return;
      if (isAnalyzingThemeRef.current) return;

      lastAnalyzedSongRef.current = currentSongStr;
      isAnalyzingThemeRef.current = true;
      setIsAnalyzingTheme(true);

      let wasAborted = false;
      try {
        await withAbort(bgAbortControllerRef, async (nextSignal) => {
          const prompt = buildThemeAnalysisPrompt({
            song,
            topic,
            mood,
            uiLanguage: uiLanguage || 'English',
          });
          const response = await generateContentWithRetry({
            model: AI_MODEL_NAME,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  mood: { type: Type.STRING },
                },
              },
            },
            signal: nextSignal,
          });

          if (nextSignal.aborted) {
            wasAborted = true;
            return;
          }

          const data = safeJsonParse<{ topic?: string; mood?: string }>(response.text || '{}', {});
          if (data.topic && data.topic !== topic) setTopic(data.topic);
          if (data.mood && data.mood !== mood) setMood(data.mood);
        });
      } catch (e) {
        if (isAbortError(e)) {
          wasAborted = true;
          return;
        }
        const msg = e instanceof Error ? e.message : '';
        const isQuota = (e as { code?: unknown })?.code === 429 || msg.includes('429') || msg.includes('quota');
        if (isQuota) {
          backoffUntilRef.current = Date.now() + 5 * 60 * 1000;
          console.warn('[useBackgroundThemeAnalysis] Quota exceeded — background analysis paused for 5 minutes.');
        } else {
          handleApiError(e, 'Background analysis failed.');
        }
      } finally {
        isAnalyzingThemeRef.current = false;
        if (!wasAborted) setIsAnalyzingTheme(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [song, topic, mood, uiLanguage, setTopic, setMood]);

  return { isAnalyzingTheme };
};

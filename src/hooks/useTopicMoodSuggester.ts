import { useState, useEffect, useCallback, useRef } from 'react';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse } from '../utils/aiUtils';
import { withAbort, isAbortError } from '../utils/withAbort';

interface TopicMoodSuggestion {
  topic: string;
  mood: string;
}

export function useTopicMoodSuggester(
  currentTopic: string,
  currentMood: string,
  songLanguage: string,
  setTopic: (v: string) => void,
  setMood: (v: string) => void
) {
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [hasSuggested, setHasSuggested] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  const generateSuggestion = useCallback(async (): Promise<TopicMoodSuggestion | null> => {
    setIsGeneratingSuggestion(true);
    let wasAborted = false;
    try {
      return await withAbort(abortControllerRef, async (nextSignal) => {
        const languageInstruction = songLanguage.trim()
          ? `\nWhen responding, write the "topic" and "mood" values exclusively in ${songLanguage.trim()}.`
          : '';
        const prompt = `Generate a creative, inspiring song topic and matching mood for a songwriting session.\nReturn as JSON:\n{\n  "topic": "short description (2-8 words)",\n  "mood": "comma-separated mood descriptors (e.g., 'Melancholic, nostalgic, bittersweet')"\n}\n\nExamples:\n- {"topic": "A lonely astronaut drifting in deep space", "mood": "Isolated, contemplative, yearning"}\n- {"topic": "Dancing in a neon-lit city at midnight", "mood": "Energetic, euphoric, cyberpunk"}\n- {"topic": "The last letter from a lost love", "mood": "Heartbreaking, tender, regretful"}\n\nBe original and evocative.${languageInstruction}`;

        const response = await generateContentWithRetry({
          model: AI_MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return null;
        }
        return safeJsonParse<TopicMoodSuggestion | null>(response.text?.trim() || '{}', null);
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return null;
      }
      console.warn('Failed to generate topic/mood suggestion:', error);
      return null;
    } finally {
      if (!wasAborted) setIsGeneratingSuggestion(false);
    }
  }, [songLanguage]);

  const resetSuggestionCycle = useCallback(() => {
    setHasSuggested(false);
  }, []);

  useEffect(() => {
    const shouldAutoSuggest =
      !hasSuggested &&
      (!currentTopic || currentTopic === 'A neon city in the rain') &&
      (!currentMood || currentMood === 'Cyberpunk, nostalgic, bittersweet, reflective');

    if (shouldAutoSuggest) {
      setHasSuggested(true);
      generateSuggestion().then(suggestion => {
        if (suggestion) {
          setTopic(suggestion.topic);
          setMood(suggestion.mood);
        }
      });
    }
  }, [currentTopic, currentMood, generateSuggestion, hasSuggested, setTopic, setMood]);

  return { generateSuggestion, isGeneratingSuggestion, resetSuggestionCycle };
}

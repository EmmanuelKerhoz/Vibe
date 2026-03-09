import { useState, useEffect } from 'react';
import { AI_MODEL_NAME, getAi } from '../utils/aiUtils';

interface TopicMoodSuggestion {
  topic: string;
  mood: string;
}

export function useTopicMoodSuggester(
  currentTopic: string,
  currentMood: string,
  setTopic: (v: string) => void,
  setMood: (v: string) => void
) {
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [hasSuggested, setHasSuggested] = useState(false);

  const generateSuggestion = async (): Promise<TopicMoodSuggestion | null> => {
    setIsGeneratingSuggestion(true);
    try {
      const prompt = `Generate a creative, inspiring song topic and matching mood for a songwriting session.\nReturn as JSON:\n{\n  "topic": "short description (2-8 words)",\n  "mood": "comma-separated mood descriptors (e.g., 'Melancholic, nostalgic, bittersweet')"\n}\n\nExamples:\n- {"topic": "A lonely astronaut drifting in deep space", "mood": "Isolated, contemplative, yearning"}\n- {"topic": "Dancing in a neon-lit city at midnight", "mood": "Energetic, euphoric, cyberpunk"}\n- {"topic": "The last letter from a lost love", "mood": "Heartbreaking, tender, regretful"}\n\nBe original and evocative.`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim() || '{}';
      const data = JSON.parse(text) as TopicMoodSuggestion;

      return data;
    } catch (error) {
      console.warn('Failed to generate topic/mood suggestion:', error);
      return null;
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTopic, currentMood, hasSuggested]);

  return { generateSuggestion, isGeneratingSuggestion };
}

import { useState } from 'react';
import { AI_MODEL_NAME, getAi, handleApiError } from '../utils/aiUtils';
import type { Section } from '../types';

export function useTitleGenerator(
  song: Section[],
  topic: string,
  mood: string,
  songLanguage: string = 'English',
) {
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const generateTitle = async (): Promise<string | null> => {
    if (song.length === 0) return null;

    setIsGeneratingTitle(true);
    try {
      const lyricsSnippet = song
        .slice(0, 2)
        .map(s => s.lines.map(l => l.text).join('\n'))
        .join('\n\n')
        .substring(0, 500);

      const prompt = `Generate a creative, concise song title (max 6 words) based on:
Topic: ${topic}
Mood: ${mood}
Lyrics excerpt:
${lyricsSnippet}

IMPORTANT: The title MUST be written in ${songLanguage}.
Return ONLY the title as plain text, no quotes, no explanation.`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
      });

      return response.text?.trim() || null;
    } catch (error) {
      handleApiError(error, 'Failed to generate title');
      return null;
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  return { generateTitle, isGeneratingTitle };
}

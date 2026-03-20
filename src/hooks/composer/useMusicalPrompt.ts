import { useState } from 'react';
import type { Section } from '../../types';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { getSongText } from '../../utils/songUtils';

type UseMusicalPromptParams = {
  song: Section[];
  title: string;
  topic: string;
  mood: string;
  genre: string;
  tempo: string;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  songLanguage: string;
  setMusicalPrompt: (value: string) => void;
  setGenre: (value: string) => void;
  setTempo: (value: string) => void;
  setInstrumentation: (value: string) => void;
  setRhythm: (value: string) => void;
  setNarrative: (value: string) => void;
};

export const useMusicalPrompt = ({
  song,
  title,
  topic,
  mood,
  genre,
  tempo,
  instrumentation,
  rhythm,
  narrative,
  songLanguage,
  setMusicalPrompt,
  setGenre,
  setTempo,
  setInstrumentation,
  setRhythm,
  setNarrative,
}: UseMusicalPromptParams) => {
  const [isGeneratingMusicalPrompt, setIsGeneratingMusicalPrompt] = useState(false);
  const [isAnalyzingLyrics, setIsAnalyzingLyrics] = useState(false);

  const generateMusicalPrompt = async () => {
    if (!title && !topic) return;
    setIsGeneratingMusicalPrompt(true);
    const lang = songLanguage || 'English';
    try {
      const lyricsSnippet = getSongText(song.slice(0, 3));
      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: `Generate a structured musical production prompt for an AI music generator (like Suno or Udio).
Song Title: ${title}
Topic/Theme: ${topic}
Mood: ${mood}
Genre: ${genre}
Tempo: ${tempo} BPM
Rhythm & Groove: ${rhythm}
Instrumentation: ${instrumentation}
Narrative / Vibe: ${narrative}
Song Language: ${lang}
Lyrics:
${lyricsSnippet}

Return a concise prompt (<= 900 characters) using this exact labeled, line-by-line format:
STYLE: [style/genre lane and sonic fingerprint]
MOOD: [emotional tone + energy level]
VOCALS: [lead style, gender/texture, harmonies/ad-libs]
INSTRUMENTATION: [key instruments/sound sources + treatment]
RHYTHM/GROOVE: [rhythmic feel, swing, percussion details]
STRUCTURE: [arrangement arc and section highlights]
MIX/SPACE: [space/reverb, width, tonal balance, mix notes]
REFERENCES: [2-3 artist or song anchors to emulate]
DELIVERY: [what to ask the model to prioritize/output]
Keep the response in English (required by music AI tools) and avoid markdown or extra commentary outside of these labeled lines.`,
      });
      setMusicalPrompt(response.text || '');
    } catch (error) {
      handleApiError(error, 'Error generating musical prompt.');
    } finally {
      setIsGeneratingMusicalPrompt(false);
    }
  };

  const analyzeLyricsForMusic = async () => {
    if (song.length === 0 && !topic && !mood) return;
    setIsAnalyzingLyrics(true);
    const lang = songLanguage || 'English';
    try {
      const lyricsText = getSongText(song);
      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: `Analyze these song lyrics and metadata to suggest detailed musical production parameters for an AI music generator.

Song Title: ${title || '(untitled)'}
Topic/Theme: ${topic || '(not specified)'}
Mood: ${mood || '(not specified)'}
Song Language: ${lang}
Lyrics:
${lyricsText || '(no lyrics yet)'}

Based on this, provide JSON with exactly these keys:
{
  "genre": "(string) specific genre/style (e.g. Cinematic Pop, Dark Trap, Indie Folk)",
  "tempo": "(string) BPM as a number string (e.g. 95)",
  "instrumentation": "(string) key instruments and sounds (e.g. Warm piano, ambient pads, sparse percussion, distant strings)",
  "rhythm": "(string) rhythmic character (e.g. Slow half-time groove with sparse hi-hats)",
  "narrative": "(string) sonic story arc and vibe (e.g. Starts intimate and raw, builds to an anthemic climax)"
}
Return only valid JSON, no markdown, no explanations.`,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = safeJsonParse<{
        genre?: string;
        tempo?: string;
        instrumentation?: string;
        rhythm?: string;
        narrative?: string;
      }>(response.text || '{}', {});
      if (parsed.genre) setGenre(parsed.genre);
      if (parsed.tempo) setTempo(parsed.tempo);
      if (parsed.instrumentation) setInstrumentation(parsed.instrumentation);
      if (parsed.rhythm) setRhythm(parsed.rhythm);
      if (parsed.narrative) setNarrative(parsed.narrative);
    } catch (error) {
      handleApiError(error, 'Error analyzing lyrics for music suggestions.');
    } finally {
      setIsAnalyzingLyrics(false);
    }
  };

  return {
    isGeneratingMusicalPrompt,
    isAnalyzingLyrics,
    generateMusicalPrompt,
    analyzeLyricsForMusic,
  };
};

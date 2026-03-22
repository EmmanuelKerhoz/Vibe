import { useState, useEffect, useRef } from 'react';
import type { Section } from '../../types';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { getSongText } from '../../utils/songUtils';
import { withAbort, isAbortError } from '../../utils/withAbort';

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

const ensureLanguageStyleLine = (prompt: string, songLanguage?: string): string => {
  const trimmedLanguage = (songLanguage || '').trim();
  if (!trimmedLanguage || !prompt.trim()) return prompt;

  const lines = prompt.split('\n');
  const styleLineIndex = lines.findIndex(line => line.trim().toUpperCase().startsWith('STYLE:'));
  if (styleLineIndex === -1) {
    return `STYLE: ${trimmedLanguage} song\n${prompt}`;
  }

  const styleLine = lines[styleLineIndex];
  if (styleLine.toLowerCase().includes(trimmedLanguage.toLowerCase())) {
    return prompt;
  }

  lines[styleLineIndex] = styleLine.replace(/^STYLE:\s*/i, `STYLE: ${trimmedLanguage} `);
  return lines.join('\n');
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
  const promptAbortRef = useRef<AbortController | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    promptAbortRef.current?.abort();
    analysisAbortRef.current?.abort();
  }, []);

  const generateMusicalPrompt = async () => {
    if (!title && !topic) return;
    setIsGeneratingMusicalPrompt(true);
    const lang = songLanguage || 'English';
    let wasAborted = false;
    try {
      await withAbort(promptAbortRef, async (nextSignal) => {
        const lyricsSnippet = getSongText(song.slice(0, 3));
        const response = await generateContentWithRetry({
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
STYLE: [style/genre lane and sonic fingerprint — MUST explicitly include the song language as part of the style label, e.g. "French chanson", "Spanish pop", "Arabic orchestral ballad"]
MOOD: [emotional tone + energy level]
VOCALS: [lead style, gender/texture, harmonies/ad-libs]
INSTRUMENTATION: [key instruments/sound sources + treatment]
RHYTHM/GROOVE: [rhythmic feel, swing, percussion details]
STRUCTURE: [arrangement arc and section highlights]
MIX/SPACE: [space/reverb, width, tonal balance, mix notes]
REFERENCES: [2-3 artist or song anchors to emulate]
DELIVERY: [what to ask the model to prioritize/output]
Keep the response in English (required by music AI tools) and avoid markdown or extra commentary outside of these labeled lines.`,
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }
        setMusicalPrompt(ensureLanguageStyleLine(response.text || '', songLanguage));
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      handleApiError(error, 'Error generating musical prompt.');
    } finally {
      if (!wasAborted) setIsGeneratingMusicalPrompt(false);
    }
  };

  const analyzeLyricsForMusic = async () => {
    if (song.length === 0 && !topic && !mood) return;
    setIsAnalyzingLyrics(true);
    const lang = songLanguage || 'English';
    let wasAborted = false;
    try {
      await withAbort(analysisAbortRef, async (nextSignal) => {
        const lyricsText = getSongText(song);
        const response = await generateContentWithRetry({
          model: AI_MODEL_NAME,
          contents: `Analyze these song lyrics and metadata to suggest detailed musical production parameters for an AI music generator.

Song Title: ${title || '(untitled)'}
Topic/Theme: ${topic || '(not specified)'}
Mood: ${mood || '(not specified)'}
Song Language: ${lang}
Lyrics:
${lyricsText || '(no lyrics yet)'}

Based on this, provide JSON with exactly these keys. Favor culturally coherent references and genre framing for ${lang}-language lyrics:
{
  "genre": "(string) specific genre/style (e.g. Cinematic Pop, Dark Trap, Indie Folk)",
  "tempo": "(string) BPM as a number string (e.g. 95)",
  "instrumentation": "(string) key instruments and sounds (e.g. Warm piano, ambient pads, sparse percussion, distant strings)",
  "rhythm": "(string) rhythmic character (e.g. Slow half-time groove with sparse hi-hats)",
  "narrative": "(string) sonic story arc and vibe (e.g. Starts intimate and raw, builds to an anthemic climax)"
}
Return only valid JSON, no markdown, no explanations.`,
          config: { responseMimeType: 'application/json' },
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }
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
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      handleApiError(error, 'Error analyzing lyrics for music suggestions.');
    } finally {
      if (!wasAborted) setIsAnalyzingLyrics(false);
    }
  };

  return {
    isGeneratingMusicalPrompt,
    isAnalyzingLyrics,
    generateMusicalPrompt,
    analyzeLyricsForMusic,
  };
};

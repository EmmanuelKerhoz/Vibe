import { useCallback, useEffect, useRef, useState } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { mapSongWithPreservedIds } from '../../utils/songMergeUtils';
import { resolveUiLanguageName } from '../../utils/uiLangUtils';
import type { Section } from '../../types';

type AnalysisReport = {
  theme: string;
  emotionalArc: string;
  technicalAnalysis: string[];
  strengths: string[];
  improvements: string[];
  musicalSuggestions: string[];
  summary: string;
};

type SaveVersionFn = (name: string, snapshot?: {
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
}) => void;

type UseSongAnalysisEngineParams = {
  song: Section[];
  topic: string;
  mood: string;
  uiLanguage: string;
  saveVersion: SaveVersionFn;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  setTopic: (value: string) => void;
  setMood: (value: string) => void;
  setIsAnalyzing: (value: boolean) => void;
};

export const useSongAnalysisEngine = ({
  song,
  topic,
  mood,
  uiLanguage,
  saveVersion,
  updateSongAndStructureWithHistory,
  setTopic,
  setMood,
  setIsAnalyzing,
}: UseSongAnalysisEngineParams) => {
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [appliedAnalysisItems, setAppliedAnalysisItems] = useState<Set<string>>(new Set());
  const [selectedAnalysisItems, setSelectedAnalysisItems] = useState<Set<string>>(new Set());
  const [isApplyingAnalysis, setIsApplyingAnalysis] = useState<string | null>(null);
  const [isAnalyzingTheme, setIsAnalyzingTheme] = useState(false);

  const lastAnalyzedSongRef = useRef<string>('');
  const backoffUntilRef = useRef<number>(0);
  const bgAbortControllerRef = useRef<AbortController | null>(null);
  const fgAbortRef = useRef<AbortController | null>(null);
  // P5-fix: ref mirror for isAnalyzingTheme — guards the background timer closure against stale capture
  const isAnalyzingThemeRef = useRef(false);

  useEffect(() => {
    return () => {
      bgAbortControllerRef.current?.abort();
      fgAbortRef.current?.abort();
    };
  }, []);

  const uiLang = resolveUiLanguageName(uiLanguage);

  // Background theme-tracking
  useEffect(() => {
    if (song.length === 0) return;

    const currentSongStr = JSON.stringify(song);
    if (currentSongStr === lastAnalyzedSongRef.current) return;

    const timer = setTimeout(async () => {
      if (Date.now() < backoffUntilRef.current) return;
      // P5-fix: read ref, not stale closure value
      if (isAnalyzingThemeRef.current) return;

      bgAbortControllerRef.current?.abort();
      const controller = new AbortController();
      bgAbortControllerRef.current = controller;

      lastAnalyzedSongRef.current = currentSongStr;

      isAnalyzingThemeRef.current = true;
      setIsAnalyzingTheme(true);
      try {
        const prompt = `Analyze the following song lyrics.\nCurrent Topic: "${topic}"\nCurrent Mood: "${mood}"\n\nIf the lyrics have significantly deviated from the current topic or mood, provide an updated topic and mood. If they still fit, return the current ones.\nIMPORTANT: Return the topic and mood values in ${uiLang}.\nReturn JSON with "topic" and "mood" strings.\n\nLyrics:\n${song.map(s => s.name + '\n' + s.lines.map(l => l.text).join('\n')).join('\n\n')}\n`;
        const response = await getAi().models.generateContent({
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
        });

        if (controller.signal.aborted) return;

        const data = safeJsonParse<{ topic?: string; mood?: string }>(response.text || '{}', {});
        if (data.topic && data.topic !== topic) setTopic(data.topic);
        if (data.mood && data.mood !== mood) setMood(data.mood);
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : '';
        const isQuota = (e as any)?.code === 429 || msg.includes('429') || msg.includes('quota');
        if (isQuota) {
          backoffUntilRef.current = Date.now() + 5 * 60 * 1000;
          console.warn('[useSongAnalysisEngine] Quota exceeded — background analysis paused for 5 minutes.');
        } else {
          handleApiError(e, 'Background analysis failed.');
        }
      } finally {
        isAnalyzingThemeRef.current = false;
        setIsAnalyzingTheme(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [song, topic, mood, uiLang, setTopic, setMood]);

  const toggleAnalysisItemSelection = useCallback((itemText: string) => {
    setSelectedAnalysisItems(prev => {
      const next = new Set(prev);
      if (next.has(itemText)) next.delete(itemText);
      else next.add(itemText);
      return next;
    });
  }, []);

  const clearAppliedAnalysisItems = useCallback(() => {
    setAppliedAnalysisItems(new Set());
  }, []);

  const applySelectedAnalysisItems = useCallback(async () => {
    if (selectedAnalysisItems.size === 0 || isApplyingAnalysis) return;

    fgAbortRef.current?.abort();
    const controller = new AbortController();
    fgAbortRef.current = controller;

    const itemsToApply = Array.from(selectedAnalysisItems);
    setIsApplyingAnalysis('batch');
    saveVersion('Before Analysis Batch Improvements');

    try {
      const prompt = `Modify the following song lyrics based on these improvement suggestions:\n      ${itemsToApply.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n      IMPORTANT:\n      1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).\n      2. Only update the lyrics as suggested.\n      3. Return the FULL updated song in the same JSON format as the input.\n      4. Do not change the section names unless specifically requested by the improvements.\n      5. Preserve the original song language in all lyric text fields.\n      6. Write the "concept" field for each line in ${uiLang}.\n\n      Current Song Data:\n      ${JSON.stringify(song)}`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhymingSyllables: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING },
                    },
                    required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
                  },
                },
              },
              required: ['name', 'lines'],
            },
          },
        },
      });

      if (controller.signal.aborted) return;

      const newSongData = safeJsonParse<any[]>(response.text || '[]', []);
      if (newSongData.length > 0) {
        const updatedSong = mapSongWithPreservedIds(newSongData, song);
        updateSongAndStructureWithHistory(updatedSong, updatedSong.map(s => s.name));
        setAppliedAnalysisItems(prev => {
          const next = new Set(prev);
          itemsToApply.forEach(item => next.add(item));
          return next;
        });
        setSelectedAnalysisItems(new Set());
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Apply batch analysis error:', error);
    } finally {
      if (!controller.signal.aborted) setIsApplyingAnalysis(null);
    }
  }, [song, selectedAnalysisItems, isApplyingAnalysis, uiLang, saveVersion, updateSongAndStructureWithHistory]);

  const applyAnalysisItem = useCallback(async (itemText: string) => {
    if (isApplyingAnalysis) return;

    fgAbortRef.current?.abort();
    const controller = new AbortController();
    fgAbortRef.current = controller;

    setIsApplyingAnalysis(itemText);

    if (appliedAnalysisItems.size === 0) {
      saveVersion('Before Analysis Improvements');
    }

    try {
      const prompt = `Modify the following song lyrics based on this specific improvement suggestion: "${itemText}".\n\n      IMPORTANT:\n      1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).\n      2. Only update the lyrics as suggested.\n      3. Return the FULL updated song in the same JSON format as the input.\n      4. Do not change the section names unless specifically requested by the improvement.\n      5. Preserve the original song language in all lyric text fields.\n      6. Write the "concept" field for each line in ${uiLang}.\n\n      Current Song Data:\n      ${JSON.stringify(song)}`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhymingSyllables: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING },
                    },
                    required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
                  },
                },
              },
              required: ['name', 'lines'],
            },
          },
        },
      });

      if (controller.signal.aborted) return;

      const newSongData = safeJsonParse<any[]>(response.text || '[]', []);
      if (newSongData.length > 0) {
        const updatedSong = mapSongWithPreservedIds(newSongData, song);
        updateSongAndStructureWithHistory(updatedSong, updatedSong.map(s => s.name));
        setAppliedAnalysisItems(prev => new Set(prev).add(itemText));
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Apply analysis error:', error);
    } finally {
      if (!controller.signal.aborted) setIsApplyingAnalysis(null);
    }
  }, [song, appliedAnalysisItems, isApplyingAnalysis, uiLang, saveVersion, updateSongAndStructureWithHistory]);

  // P7-fix: useCallback for reference stability
  const analyzeCurrentSong = useCallback(async () => {
    if (song.length === 0) return;

    fgAbortRef.current?.abort();
    const controller = new AbortController();
    fgAbortRef.current = controller;

    setIsAnalyzing(true);
    setAnalysisSteps(['Gathering song data...']);
    setIsAnalysisModalOpen(true);
    setAnalysisReport(null);
    setAppliedAnalysisItems(new Set());

    try {
      setAnalysisSteps(prev => [...prev, 'Analyzing structure and flow...']);
      const songText = song.map(s => `[${s.name}]\n${s.lines.map(l => l.text).join('\n')}`).join('\n\n');

      const prompt = `Thoroughly analyze the following song lyrics.\n      Provide a detailed report including:\n      1. Overall Theme & Narrative: What is the song truly about?\n      2. Emotional Arc: How do the emotions shift throughout the song?\n      3. Technical Analysis: Rhyme schemes, syllable consistency, and rhythmic flow.\n      4. Strengths: What works well in the current version?\n      5. Actionable Improvements: Specific suggestions to improve the lyrics, structure, or impact.\n      6. Musical Suggestions: Ideas for instrumentation or vocal delivery based on the lyrics.\n\n      IMPORTANT: Write the ENTIRE analysis report in ${uiLang}.\n\n      Song Lyrics:\n      ${songText}`;

      setAnalysisSteps(prev => [...prev, 'Consulting AI Lyricist...']);
      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              emotionalArc: { type: Type.STRING },
              technicalAnalysis: { type: Type.ARRAY, items: { type: Type.STRING } },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              musicalSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
            },
            required: ['theme', 'emotionalArc', 'technicalAnalysis', 'strengths', 'improvements', 'musicalSuggestions', 'summary'],
          },
        },
      });

      if (controller.signal.aborted) return;

      setAnalysisSteps(prev => [...prev, 'Finalizing report...']);
      const data = safeJsonParse<AnalysisReport>(response.text || '{}', {
        theme: '',
        emotionalArc: '',
        technicalAnalysis: [],
        strengths: [],
        improvements: [],
        musicalSuggestions: [],
        summary: '',
      });
      setAnalysisReport(data);
      setAnalysisSteps(prev => [...prev, 'Analysis complete!']);
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Analysis error:', error);
      setAnalysisSteps(prev => [...prev, 'Error during analysis. Please try again.']);
    } finally {
      if (!controller.signal.aborted) setIsAnalyzing(false);
    }
  }, [song, uiLang, setIsAnalyzing]);

  return {
    isAnalysisModalOpen,
    setIsAnalysisModalOpen,
    analysisReport,
    analysisSteps,
    appliedAnalysisItems,
    selectedAnalysisItems,
    isApplyingAnalysis,
    isAnalyzingTheme,
    toggleAnalysisItemSelection,
    applySelectedAnalysisItems,
    applyAnalysisItem,
    analyzeCurrentSong,
    clearAppliedAnalysisItems,
  };
};

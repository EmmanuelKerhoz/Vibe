import { useCallback, useEffect, useRef, useState } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { mapSongWithPreservedIds } from '../../utils/songMergeUtils';
import { resolveUiLanguageName } from '../../utils/uiLangUtils';
import { getSectionText } from '../../utils/songUtils';
import type { Section } from '../../types';
import { abortCurrent, withAbort, isAbortError } from '../../utils/withAbort';
import {
  buildApplyAnalysisBatchPrompt,
  buildApplyAnalysisItemPrompt,
  buildSongAnalysisPrompt,
  buildThemeAnalysisPrompt,
} from '../../utils/promptUtils';
import { analyzeSongRhymes } from '../../utils/songRhymeAnalysis';

export { analyzeSongRhymes } from '../../utils/songRhymeAnalysis';

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
  /** Background-only controller for delayed theme/mood analysis triggered by song edits. */
  const bgAbortControllerRef = useRef<AbortController | null>(null);
  /** Foreground-only controller for user-triggered analysis/apply actions; keep separate from background aborts. */
  const fgAbortRef = useRef<AbortController | null>(null);
  const isAnalyzingThemeRef = useRef(false);

  useEffect(() => {
    return () => {
      abortCurrent(bgAbortControllerRef);
      abortCurrent(fgAbortRef);
    };
  }, []);

  const uiLang = resolveUiLanguageName(uiLanguage);

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
            uiLanguage: uiLang,
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
          console.warn('[useSongAnalysisEngine] Quota exceeded — background analysis paused for 5 minutes.');
        } else {
          handleApiError(e, 'Background analysis failed.');
        }
      } finally {
        isAnalyzingThemeRef.current = false;
        if (!wasAborted) setIsAnalyzingTheme(false);
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

  const analyzeLocalRhymes = useCallback(() => analyzeSongRhymes(song), [song]);

  const applySelectedAnalysisItems = useCallback(async () => {
    if (selectedAnalysisItems.size === 0 || isApplyingAnalysis) return;

    const itemsToApply = Array.from(selectedAnalysisItems);
    setIsApplyingAnalysis('batch');
    saveVersion('Before Analysis Batch Improvements');

    let wasAborted = false;
    try {
      await withAbort(fgAbortRef, async (nextSignal) => {
        const prompt = buildApplyAnalysisBatchPrompt({
          song,
          itemsToApply,
          uiLanguage: uiLang,
        });

        const response = await generateContentWithRetry({
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
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

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
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      console.error('Apply batch analysis error:', error);
    } finally {
      if (!wasAborted) setIsApplyingAnalysis(null);
    }
  }, [song, selectedAnalysisItems, isApplyingAnalysis, uiLang, saveVersion, updateSongAndStructureWithHistory]);

  const applyAnalysisItem = useCallback(async (itemText: string) => {
    if (isApplyingAnalysis) return;

    setIsApplyingAnalysis(itemText);

    if (appliedAnalysisItems.size === 0) {
      saveVersion('Before Analysis Improvements');
    }

    let wasAborted = false;
    try {
      await withAbort(fgAbortRef, async (nextSignal) => {
        const prompt = buildApplyAnalysisItemPrompt({
          song,
          itemText,
          uiLanguage: uiLang,
        });

        const response = await generateContentWithRetry({
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
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

        const newSongData = safeJsonParse<any[]>(response.text || '[]', []);
        if (newSongData.length > 0) {
          const updatedSong = mapSongWithPreservedIds(newSongData, song);
          updateSongAndStructureWithHistory(updatedSong, updatedSong.map(s => s.name));
          setAppliedAnalysisItems(prev => new Set(prev).add(itemText));
        }
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      console.error('Apply analysis error:', error);
    } finally {
      if (!wasAborted) setIsApplyingAnalysis(null);
    }
  }, [song, appliedAnalysisItems, isApplyingAnalysis, uiLang, saveVersion, updateSongAndStructureWithHistory]);

  const analyzeCurrentSong = useCallback(async () => {
    if (song.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisSteps(['Gathering song data...']);
    setIsAnalysisModalOpen(true);
    setAnalysisReport(null);
    setAppliedAnalysisItems(new Set());

    let wasAborted = false;
    try {
      await withAbort(fgAbortRef, async (nextSignal) => {
        setAnalysisSteps(prev => [...prev, 'Analyzing structure and flow...']);
        const songText = song.map(s => `[${s.name}]\n${getSectionText(s)}`).join('\n\n');

        const prompt = buildSongAnalysisPrompt({
          songText,
          uiLanguage: uiLang,
        });

        setAnalysisSteps(prev => [...prev, 'Consulting AI Lyricist...']);
        const response = await generateContentWithRetry({
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
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

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
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      console.error('Analysis error:', error);
      setAnalysisSteps(prev => [...prev, 'Error during analysis. Please try again.']);
    } finally {
      if (!wasAborted) setIsAnalyzing(false);
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
    analyzeLocalRhymes,
    applySelectedAnalysisItems,
    applyAnalysisItem,
    analyzeCurrentSong,
    clearAppliedAnalysisItems,
  };
};

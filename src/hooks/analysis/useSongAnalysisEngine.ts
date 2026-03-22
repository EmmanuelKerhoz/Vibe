import { useCallback, useEffect, useRef, useState } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { languageNameToCode } from '../../constants/langFamilyMap';
import { compareTextsWithIPA } from '../../utils/ipaPipeline';
import { detectRhymeSchemeLocally } from '../../utils/rhymeSchemeUtils';
import { mapSongWithPreservedIds } from '../../utils/songMergeUtils';
import { resolveUiLanguageName } from '../../utils/uiLangUtils';
import { getSectionText } from '../../utils/songUtils';
import type { Section } from '../../types';
import { abortCurrent, withAbort, isAbortError } from '../../utils/withAbort';

type AnalysisReport = {
  theme: string;
  emotionalArc: string;
  technicalAnalysis: string[];
  strengths: string[];
  improvements: string[];
  musicalSuggestions: string[];
  summary: string;
};

/**
 * Local rhyme comparison for a pair of lyric lines.
 * `quality` mirrors the IPA rhyme classifier, `confidenceScore` is the normalized
 * 0–100 score used by the hook, and `isApproximated` flags mocked or downgraded
 * near-matches that should count below an exact pair of the same base similarity.
 */
export type LocalRhymePairAnalysis = {
  lineIndexes: [number, number];
  lines: [string, string];
  quality: string;
  confidenceScore: number;
  usedIpa: boolean;
  isApproximated: boolean;
};

/**
 * Per-section rhyme diagnostics built locally before any AI analysis.
 * `mode: "ipa"` means a supported language was analyzed through compareTextsWithIPA,
 * while `mode: "graphemic"` indicates an unsupported language or graceful fallback.
 */
export type LocalRhymeSectionAnalysis = {
  sectionId: string;
  sectionName: string;
  langCode?: string;
  detectedScheme: string | null;
  mode: 'ipa' | 'graphemic';
  pairs: LocalRhymePairAnalysis[];
};

const toPairConfidenceScore = (similarity: { score?: number; isApproximated?: boolean }) => {
  const baseScore = typeof similarity.score === 'number' ? similarity.score : 0;
  const adjustedScore = similarity.isApproximated ? baseScore * 0.85 : baseScore;
  return Math.round(adjustedScore * 1000) / 10;
};

/**
 * Builds lightweight, local rhyme diagnostics for each song section.
 * It uses IPA comparison when the section language is supported and falls back
 * to graphemic scheme detection whenever the language is unsupported or the IPA
 * comparison fails, without throwing to the caller.
 */
export const analyzeSongRhymes = async (song: Section[]): Promise<LocalRhymeSectionAnalysis[]> => {
  return Promise.all(song.map(async section => {
    const lyricLines = section.lines
      .filter(line => !line.isMeta)
      .map(line => line.text.trim())
      .filter(Boolean);

    const langCode = languageNameToCode(section.language ?? '');
    const detectedScheme = detectRhymeSchemeLocally(lyricLines, langCode);

    if (!langCode || lyricLines.length < 2) {
      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode,
        detectedScheme,
        mode: 'graphemic' as const,
        pairs: [],
      };
    }

    try {
      const pairs: LocalRhymePairAnalysis[] = [];

      for (let firstIndex = 0; firstIndex < lyricLines.length; firstIndex++) {
        for (let secondIndex = firstIndex + 1; secondIndex < lyricLines.length; secondIndex++) {
          const firstLine = lyricLines[firstIndex];
          const secondLine = lyricLines[secondIndex];
          if (!firstLine || !secondLine) continue;

          const similarity = await compareTextsWithIPA(
            firstLine,
            secondLine,
            langCode,
          );

          pairs.push({
            lineIndexes: [firstIndex, secondIndex],
            lines: [firstLine, secondLine],
            quality: similarity.quality,
            confidenceScore: toPairConfidenceScore(similarity as { score?: number; isApproximated?: boolean }),
            usedIpa: true,
            isApproximated: Boolean((similarity as { isApproximated?: boolean }).isApproximated),
          });
        }
      }

      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode,
        detectedScheme,
        mode: 'ipa' as const,
        pairs,
      };
    } catch {
      return {
        sectionId: section.id,
        sectionName: section.name,
        langCode,
        detectedScheme,
        mode: 'graphemic' as const,
        pairs: [],
      };
    }
  }));
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
          const prompt = `Analyze the following song lyrics.\nCurrent Topic: "${topic}"\nCurrent Mood: "${mood}"\n\nIf the lyrics have significantly deviated from the current topic or mood, provide an updated topic and mood. If they still fit, return the current ones.\nIMPORTANT: Return the topic and mood values in ${uiLang}.\nReturn JSON with "topic" and "mood" strings.\n\nLyrics:\n${song.map(s => s.name + '\n' + getSectionText(s)).join('\n\n')}\n`;
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
        const prompt = `Modify the following song lyrics based on these improvement suggestions:\n      ${itemsToApply.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n      IMPORTANT:\n      1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).\n      2. Only update the lyrics as suggested.\n      3. Return the FULL updated song in the same JSON format as the input.\n      4. Do not change the section names unless specifically requested by the improvements.\n      5. Preserve the original song language in all lyric text fields.\n      6. Write the "concept" field for each line in ${uiLang}.\n\n      Current Song Data:\n      ${JSON.stringify(song)}`;

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
        const prompt = `Modify the following song lyrics based on this specific improvement suggestion: "${itemText}".\n\n      IMPORTANT:\n      1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).\n      2. Only update the lyrics as suggested.\n      3. Return the FULL updated song in the same JSON format as the input.\n      4. Do not change the section names unless specifically requested by the improvement.\n      5. Preserve the original song language in all lyric text fields.\n      6. Write the "concept" field for each line in ${uiLang}.\n\n      Current Song Data:\n      ${JSON.stringify(song)}`;

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

        const prompt = `Thoroughly analyze the following song lyrics.\n      Provide a detailed report including:\n      1. Overall Theme & Narrative: What is the song truly about?\n      2. Emotional Arc: How do the emotions shift throughout the song?\n      3. Technical Analysis: Rhyme schemes, syllable consistency, and rhythmic flow.\n      4. Strengths: What works well in the current version?\n      5. Actionable Improvements: Specific suggestions to improve the lyrics, structure, or impact.\n      6. Musical Suggestions: Ideas for instrumentation or vocal delivery based on the lyrics.\n\n      IMPORTANT: Write the ENTIRE analysis report in ${uiLang}.\n\n      Song Lyrics:\n      ${songText}`;

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

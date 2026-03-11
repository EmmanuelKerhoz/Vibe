import { useEffect, useRef, useState } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { mapSongWithPreservedIds } from '../../utils/songMergeUtils';
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

  const uiLang = uiLanguage === 'fr' ? 'French'
    : uiLanguage === 'es' ? 'Spanish'
    : uiLanguage === 'de' ? 'German'
    : uiLanguage === 'pt' ? 'Portuguese'
    : uiLanguage === 'ar' ? 'Arabic'
    : uiLanguage === 'zh' ? 'Chinese'
    : 'English';

  useEffect(() => {
    if (song.length === 0) return;

    const currentSongStr = JSON.stringify(song);
    if (currentSongStr === lastAnalyzedSongRef.current) return;

    const timer = setTimeout(async () => {
      if (Date.now() < backoffUntilRef.current) return;
      if (isAnalyzingTheme) return; // already running
      setIsAnalyzingTheme(true);
      try {
        const prompt = `Analyze the following song lyrics.
Current Topic: "${topic}"
Current Mood: "${mood}"

If the lyrics have significantly deviated from the current topic or mood, provide an updated topic and mood. If they still fit, return the current ones.
IMPORTANT: Return the topic and mood values in ${uiLang}.
Return JSON with "topic" and "mood" strings.

Lyrics:
${song.map(s => s.name + '\n' + s.lines.map(l => l.text).join('\n')).join('\n\n')}
`;
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

        const data = safeJsonParse<{ topic?: string; mood?: string }>(response.text || '{}', {});
        if (data.topic && data.topic !== topic) setTopic(data.topic);
        if (data.mood && data.mood !== mood) setMood(data.mood);
        lastAnalyzedSongRef.current = currentSongStr;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        const isQuota = (e as any)?.code === 429 || msg.includes('429') || msg.includes('quota');
        if (isQuota) {
          // Backoff 5 minutes on quota exhaustion
          backoffUntilRef.current = Date.now() + 5 * 60 * 1000;
          console.warn('[useSongAnalysis] Quota exceeded — background analysis paused for 5 minutes.');
        } else {
          handleApiError(e, 'Background analysis failed.');
        }
      } finally {
        setIsAnalyzingTheme(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [song, topic, mood, uiLang, setTopic, setMood]);

  const toggleAnalysisItemSelection = (itemText: string) => {
    setSelectedAnalysisItems(prev => {
      const next = new Set(prev);
      if (next.has(itemText)) {
        next.delete(itemText);
      } else {
        next.add(itemText);
      }
      return next;
    });
  };

  const applySelectedAnalysisItems = async () => {
    if (selectedAnalysisItems.size === 0 || isApplyingAnalysis) return;

    const itemsToApply = Array.from(selectedAnalysisItems);
    setIsApplyingAnalysis('batch');
    saveVersion('Before Analysis Batch Improvements');

    try {
      const prompt = `Modify the following song lyrics based on these improvement suggestions:
      ${itemsToApply.map((item, i) => `${i + 1}. ${item}`).join('\n')}

      IMPORTANT:
      1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).
      2. Only update the lyrics as suggested.
      3. Return the FULL updated song in the same JSON format as the input.
      4. Do not change the section names unless specifically requested by the improvements.
      5. Preserve the original song language in all lyric text fields.
      6. Write the "concept" field for each line in ${uiLang}.

      Current Song Data:
      ${JSON.stringify(song)}`;

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
      console.error('Apply batch analysis error:', error);
    } finally {
      setIsApplyingAnalysis(null);
    }
  };

  const applyAnalysisItem = async (itemText: string) => {
    if (isApplyingAnalysis) return;
    setIsApplyingAnalysis(itemText);

    if (appliedAnalysisItems.size === 0) {
      saveVersion('Before Analysis Improvements');
    }

    try {
      const prompt = `Modify the following song lyrics based on this specific improvement suggestion: "${itemText}".

      IMPORTANT:
      1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).
      2. Only update the lyrics as suggested.
      3. Return the FULL updated song in the same JSON format as the input.
      4. Do not change the section names unless specifically requested by the improvement.
      5. Preserve the original song language in all lyric text fields.
      6. Write the "concept" field for each line in ${uiLang}.

      Current Song Data:
      ${JSON.stringify(song)}`;

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

      const newSongData = safeJsonParse<any[]>(response.text || '[]', []);
      if (newSongData.length > 0) {
        const updatedSong = mapSongWithPreservedIds(newSongData, song);
        updateSongAndStructureWithHistory(updatedSong, updatedSong.map(s => s.name));
        setAppliedAnalysisItems(prev => new Set(prev).add(itemText));
      }
    } catch (error) {
      console.error('Apply analysis error:', error);
    } finally {
      setIsApplyingAnalysis(null);
    }
  };

  const analyzeCurrentSong = async () => {
    if (song.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisSteps(['Gathering song data...']);
    setIsAnalysisModalOpen(true);
    setAnalysisReport(null);
    setAppliedAnalysisItems(new Set());

    try {
      setAnalysisSteps(prev => [...prev, 'Analyzing structure and flow...']);
      const songText = song.map(s => `[${s.name}]\n${s.lines.map(l => l.text).join('\n')}`).join('\n\n');

      const prompt = `Thoroughly analyze the following song lyrics.
      Provide a detailed report including:
      1. Overall Theme & Narrative: What is the song truly about?
      2. Emotional Arc: How do the emotions shift throughout the song?
      3. Technical Analysis: Rhyme schemes, syllable consistency, and rhythmic flow.
      4. Strengths: What works well in the current version?
      5. Actionable Improvements: Specific suggestions to improve the lyrics, structure, or impact.
      6. Musical Suggestions: Ideas for instrumentation or vocal delivery based on the lyrics.

      IMPORTANT: Write the ENTIRE analysis report in ${uiLang}.

      Song Lyrics:
      ${songText}`;

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
      console.error('Analysis error:', error);
      setAnalysisSteps(prev => [...prev, 'Error during analysis. Please try again.']);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAppliedAnalysisItems = () => {
    setAppliedAnalysisItems(new Set());
  };

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

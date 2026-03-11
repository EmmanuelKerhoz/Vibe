import { useEffect, useRef, useState } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../utils/aiUtils';
import { cleanSectionName } from '../utils/songUtils';
import { generateId } from '../utils/idUtils';
import type { Section } from '../types';
import { mapSongWithPreservedIds, mergeAiSectionIntoCurrent } from '../utils/songMergeUtils';

type UseSongAnalysisParams = {
  song: Section[];
  topic: string;
  mood: string;
  rhymeScheme: string;
  uiLanguage: string;
  setTopic: (value: string) => void;
  setMood: (value: string) => void;
  saveVersion: (name: string, snapshot?: {
    song: Section[];
    structure: string[];
    title: string;
    titleOrigin: 'user' | 'ai';
    topic: string;
    mood: string;
  }) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateSongWithHistory: (newSong: Section[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  clearLineSelection: () => void;
  requestAutoTitleGeneration: () => void;
};

type AnalysisReport = {
  theme: string;
  emotionalArc: string;
  technicalAnalysis: string[];
  strengths: string[];
  improvements: string[];
  musicalSuggestions: string[];
  summary: string;
};


export const useSongAnalysis = ({
  song,
  topic,
  mood,
  rhymeScheme,
  uiLanguage,
  setTopic,
  setMood,
  saveVersion,
  updateState,
  updateSongWithHistory,
  updateSongAndStructureWithHistory,
  clearLineSelection,
  requestAutoTitleGeneration,
}: UseSongAnalysisParams) => {
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [appliedAnalysisItems, setAppliedAnalysisItems] = useState<Set<string>>(new Set());
  const [selectedAnalysisItems, setSelectedAnalysisItems] = useState<Set<string>>(new Set());
  const [isApplyingAnalysis, setIsApplyingAnalysis] = useState<string | null>(null);
  const [isAnalyzingTheme, setIsAnalyzingTheme] = useState(false);
  const [songLanguage, setSongLanguage] = useState<string>('English');
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [sectionTargetLanguages, setSectionTargetLanguages] = useState<Record<string, string>>({});
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [isAdaptingLanguage, setIsAdaptingLanguage] = useState(false);

  const lastAnalyzedSongRef = useRef<string>('');
  const backoffUntilRef = useRef<number>(0);

  const updateSong = (transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({
      song: transform(current.song),
      structure: current.structure,
    }));
  };

  // Resolve the full language name for the UI language code
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

  const detectLanguage = async () => {
    if (song.length === 0) return;
    setIsDetectingLanguage(true);
    try {
      const songText = song.map(s => s.lines.map(l => l.text).join('\n')).join('\n');
      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: `Detect the language of these lyrics. Return ONLY the name of the language in English (e.g., "English", "French", "Spanish").\n\nLyrics:\n${songText.substring(0, 1000)}`,
      });
      const detected = response.text?.trim() || 'English';
      setSongLanguage(detected);
    } catch (error) {
      console.error('Language detection error:', error);
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  const adaptSongLanguage = async (newLanguage: string) => {
    if (song.length === 0 || newLanguage === songLanguage) return;
    setIsAdaptingLanguage(true);
    saveVersion(`Before Translation to ${newLanguage}`);

    try {
      const prompt = `You are an expert lyricist specializing in creative song adaptation across languages.

Your task: Adapt the following song lyrics to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.

CRITICAL GUIDELINES:

1. EMOTIONAL IMPACT FIRST
   - Preserve the emotional journey and core message
   - Prioritize how the lyrics make people FEEL over word-for-word accuracy
   - Maintain the song's vibe, tone, and artistic intent

2. NATURAL LANGUAGE
   - Write as if the song was originally composed in ${newLanguage}
   - Use idioms, expressions, and cultural references native to ${newLanguage}
   - Avoid "translation-speak" - make it sound authentic and poetic
   - Respect ${newLanguage} grammar, syntax, and natural word order

3. POETIC STRUCTURE
   - Maintain rhyme scheme quality (e.g., if AABB, keep clean rhymes in ${newLanguage})
   - Match syllable counts when possible, but prioritize natural phrasing
   - Preserve rhythm and singability
   - Adapt imagery and metaphors to resonate in the target culture

4. CULTURAL ADAPTATION
   - Replace culture-specific references with equivalent concepts in ${newLanguage} culture
   - Adapt humor, wordplay, and double meanings creatively
   - Ensure themes and stories make sense to ${newLanguage} speakers

5. TECHNICAL REQUIREMENTS
   - Maintain the existing section structure (same section names)
   - Return the FULL updated song in the same JSON format as input
   - Update rhymingSyllables to reflect actual ${newLanguage} rhymes
   - Adjust syllable counts to match the adapted lyrics
   - Write the "concept" field for each line in ${uiLang}

Current Song Data:
${JSON.stringify(song)}

Return the fully adapted song that feels native to ${newLanguage} speakers while preserving the soul of the original.`;

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
        const updatedSong = mapSongWithPreservedIds(newSongData, song, newLanguage);
        updateSongAndStructureWithHistory(updatedSong, updatedSong.map(s => s.name));
        setSongLanguage(newLanguage);
      }
    } catch (error) {
      console.error('Language adaptation error:', error);
    } finally {
      setIsAdaptingLanguage(false);
    }
  };

  const adaptSectionLanguage = async (sectionId: string, newLanguage: string) => {
    const section = song.find(s => s.id === sectionId);
    if (!section) return;

    setIsAdaptingLanguage(true);
    saveVersion(`Before Section ${section.name} Translation to ${newLanguage}`);

    try {
      const prompt = `You are an expert lyricist specializing in creative song adaptation across languages.

Adapt the following song section to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.
Keep section name unchanged. Update rhymingSyllables. Adjust syllable counts.
Write the "concept" field for each line in ${uiLang}.

Current Section Data:
${JSON.stringify(section)}`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
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
      });

      const newSectionData = safeJsonParse<any>(response.text || '{}', {});
      if (newSectionData.name) {
        updateSong(currentSong =>
          currentSong.map(currentSection => {
            if (currentSection.id !== sectionId) return currentSection;
            return mergeAiSectionIntoCurrent(currentSection, newSectionData, newLanguage);
          })
        );
      }
    } catch (error) {
      console.error('Section language adaptation error:', error);
    } finally {
      setIsAdaptingLanguage(false);
    }
  };

  /**
   * Import + parse pasted lyrics.
   * Order: structure sections → detect language → update topic/mood → request title
   */
  const analyzePastedLyrics = async () => {
    if (!pastedText.trim()) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze the following lyrics and structure them into sections.
IMPORTANT: You MUST ONLY use the following section names (you can append numbers like "Verse 1", "Chorus 2"):
- Intro
- Verse
- Pre-Chorus
- Chorus
- Bridge
- Outro

CRITICAL INSTRUCTIONS:
1. ONLY analyze the lyrics provided below.
2. DO NOT generate new lyrics.
3. DO NOT continue the song.
4. Stop immediately when you reach the end of the provided lyrics.
5. Keep concepts very short (1-3 words) and write them in ${uiLang}.
6. Detect the language of the lyrics and return it as "language" (e.g. "English", "French", "Yoruba").
7. Return the topic and mood in ${uiLang}.

Do NOT use any other section names. If a block of text is an instruction or meta-text, ignore it.

Extract the overall topic/theme and mood/vibe.
For each section, identify the rhyme scheme (e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE).
For each line: exact lyric text, rhyming syllables, rhyme identifier, exact syllable count, short core concept.

Lyrics:
${pastedText}`;

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
              language: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    rhymeScheme: {
                      type: Type.STRING,
                      description: 'Rhyme scheme for this section, e.g. AABB, ABAB, FREE',
                    },
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
                  required: ['name', 'lines', 'rhymeScheme'],
                },
              },
            },
            required: ['topic', 'mood', 'language', 'sections'],
          },
        },
      });

      const data = safeJsonParse<any>(response.text || '{}', {});

      if (data.topic) setTopic(data.topic);
      if (data.mood) setMood(data.mood);

      if (data.language) {
        setSongLanguage(data.language);
        setTargetLanguage(data.language);
      }

      const sections = data.sections || [];
      if (sections.length === 0) {
        throw new Error('No sections could be extracted. Please check the lyrics format.');
      }

      const songWithIds = sections.map((section: any) => ({
        ...section,
        name: cleanSectionName(section.name),
        id: generateId(),
        rhymeScheme: section.rhymeScheme || rhymeScheme,
        lines: section.lines.map((line: any) => ({
          ...line,
          id: generateId(),
          isManual: true,
        })),
      }));

      const newStructure = sections.map((s: any) => cleanSectionName(s.name));
      updateSongAndStructureWithHistory(songWithIds, newStructure);

      requestAutoTitleGeneration();
      clearLineSelection();
      setIsPasteModalOpen(false);
      setPastedText('');
    } catch (error) {
      handleApiError(error, 'Failed to analyze lyrics. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAppliedAnalysisItems = () => {
    setAppliedAnalysisItems(new Set());
  };

  return {
    isPasteModalOpen,
    setIsPasteModalOpen,
    pastedText,
    setPastedText,
    isAnalyzing,
    isAnalysisModalOpen,
    setIsAnalysisModalOpen,
    analysisReport,
    analysisSteps,
    appliedAnalysisItems,
    selectedAnalysisItems,
    isApplyingAnalysis,
    isAnalyzingTheme,
    songLanguage,
    targetLanguage,
    setTargetLanguage,
    sectionTargetLanguages,
    setSectionTargetLanguages,
    isDetectingLanguage,
    isAdaptingLanguage,
    toggleAnalysisItemSelection,
    applySelectedAnalysisItems,
    applyAnalysisItem,
    analyzeCurrentSong,
    detectLanguage,
    adaptSongLanguage,
    adaptSectionLanguage,
    analyzePastedLyrics,
    clearAppliedAnalysisItems,
  };
};

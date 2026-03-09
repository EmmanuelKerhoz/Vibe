import { useEffect, useRef, useState } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../utils/aiUtils';
import { cleanSectionName } from '../utils/songUtils';
import { generateId } from '../utils/idUtils';
import type { Section } from '../types';

type UseSongAnalysisParams = {
  song: Section[];
  topic: string;
  mood: string;
  rhymeScheme: string;
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

const mapSongWithPreservedIds = (newSongData: any[], song: Section[], language?: string): Section[] => {
  return newSongData.map((s: any, idx: number) => {
    const existingSection = (song[idx] || {}) as any;
  
  return {
      ...existingSection,
      ...s,
      id: existingSection.id || generateId(),
      language: language ?? existingSection.language,
      lines: s.lines.map((l: any, lIdx: number) => ({
        ...l,
        id: (existingSection.lines && existingSection.lines[lIdx]?.id) || generateId(),
      })),
    };
  });
};

const mergeAiSectionIntoCurrent = (currentSection: Section, aiSection: any, language?: string): Section => {
  const mergedName = cleanSectionName(aiSection?.name || currentSection.name);
  const mergedRhymeScheme = aiSection?.rhymeScheme || currentSection.rhymeScheme;
  const mergedLinesSource = Array.isArray(aiSection?.lines) ? aiSection.lines : currentSection.lines;

  return {
    ...currentSection,
    ...aiSection,
    id: currentSection.id,
    name: mergedName,
    rhymeScheme: mergedRhymeScheme,
    language: language ?? currentSection.language,
    lines: mergedLinesSource.map((line: any, index: number) => ({
      ...(currentSection.lines[index] || {}),
      ...line,
      id: currentSection.lines[index]?.id || generateId(),
      text: line?.text ?? currentSection.lines[index]?.text ?? '',
      rhymingSyllables: line?.rhymingSyllables ?? currentSection.lines[index]?.rhymingSyllables ?? '',
      rhyme: line?.rhyme ?? currentSection.lines[index]?.rhyme ?? '',
      syllables: typeof line?.syllables === 'number' ? line.syllables : currentSection.lines[index]?.syllables ?? 0,
      concept: line?.concept ?? currentSection.lines[index]?.concept ?? 'New line',
    })),
  };
};

export const useSongAnalysis = ({
  song,
  topic,
  mood,
  rhymeScheme,
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

  const updateSong = (transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({
      song: transform(current.song),
      structure: current.structure,
    }));
  };

  useEffect(() => {
    if (song.length === 0) return;

    const currentSongStr = JSON.stringify(song);
    if (currentSongStr === lastAnalyzedSongRef.current) return;

    const timer = setTimeout(async () => {
      setIsAnalyzingTheme(true);
      try {
        const prompt = `Analyze the following song lyrics.
Current Topic: "${topic}"
Current Mood: "${mood}"

If the lyrics have significantly deviated from the current topic or mood, provide an updated topic and mood. If they still fit, return the current ones.
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
        handleApiError(e, 'Background analysis failed.');
      } finally {
        setIsAnalyzingTheme(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [song, topic, mood, setTopic, setMood]);

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
        contents: `Detect the language of these lyrics. Return ONLY the name of the language (e.g., "English", "French", "Spanish").\n\nLyrics:\n${songText.substring(0, 1000)}`,
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

EXAMPLE MINDSET:
Instead of translating "I'm feeling blue" → "Je me sens bleu" (literal, awkward)
Adapt to → "J'ai le cafard" or "J'ai le cœur gros" (natural, culturally authentic)

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

Your task: Adapt the following song section to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.

CRITICAL GUIDELINES:

1. EMOTIONAL IMPACT FIRST
   - Preserve the emotional tone and core message of this section
   - Prioritize how the lyrics make people FEEL over word-for-word accuracy
   - Maintain the section's role in the song's narrative arc

2. NATURAL LANGUAGE
   - Write as if the section was originally composed in ${newLanguage}
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
   - Ensure themes make sense to ${newLanguage} speakers

5. TECHNICAL REQUIREMENTS
   - Return ONLY the updated section in the same JSON format as input
   - Keep the section name unchanged
   - Update rhymingSyllables to reflect actual ${newLanguage} rhymes
   - Adjust syllable counts to match the adapted lyrics

EXAMPLE MINDSET:
Instead of translating "I'm feeling blue" → "Je me sens bleu" (literal, awkward)
Adapt to → "J'ai le cafard" or "J'ai le cœur gros" (natural, culturally authentic)

Current Section Data:
${JSON.stringify(section)}

Return the fully adapted section that feels native to ${newLanguage} speakers while preserving the soul of the original.`;

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
5. Keep concepts very short (1-3 words).

Do NOT use any other section names (like "Meta", "Instruction", "Instrumental", etc.). If a block of text is an instruction or meta-text, either ignore it or include it in the nearest valid section.

Extract the overall topic/theme and mood/vibe.
For each section, identify the rhyme scheme (e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE).
For each line, provide the exact lyric text, the rhyming syllables (the actual syllables that rhyme, e.g., "ain", "ight"), the rhyme identifier (e.g., A, B), the exact syllable count, and a short core concept.

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
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    rhymeScheme: {
                      type: Type.STRING,
                      description: 'The rhyme scheme for this section, e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE',
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
            required: ['topic', 'mood', 'sections'],
          },
        },
      });

      const data = safeJsonParse<any>(response.text || '{}', {});
      if (data.topic) setTopic(data.topic);
      if (data.mood) setMood(data.mood);

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

import { useState, useRef, useEffect } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { cleanSectionName, detectRhymeSchemeLocally } from '../../utils/songUtils';
import { isPureMetaLine } from '../../utils/metaUtils';
import { generateId } from '../../utils/idUtils';
import type { Section } from '../../types';

type UsePasteImportParams = {
  rhymeScheme: string;
  uiLanguage: string;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  setTopic: (value: string) => void;
  setMood: (value: string) => void;
  setSongLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  requestAutoTitleGeneration: () => void;
  clearLineSelection: () => void;
  setIsAnalyzing: (value: boolean) => void;
};

export const usePasteImport = ({
  rhymeScheme,
  uiLanguage,
  updateSongAndStructureWithHistory,
  setTopic,
  setMood,
  setSongLanguage,
  setTargetLanguage,
  requestAutoTitleGeneration,
  clearLineSelection,
  setIsAnalyzing,
}: UsePasteImportParams) => {
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => { return () => { abortControllerRef.current?.abort(); }; }, []);

  const uiLang = uiLanguage === 'fr' ? 'French'
    : uiLanguage === 'es' ? 'Spanish'
    : uiLanguage === 'de' ? 'German'
    : uiLanguage === 'pt' ? 'Portuguese'
    : uiLanguage === 'ar' ? 'Arabic'
    : uiLanguage === 'zh' ? 'Chinese'
    : uiLanguage === 'ko' ? 'Korean'
    : 'English';

  const analyzePastedLyrics = async () => {
    if (!pastedText.trim()) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    try {
      const prompt = `Analyze the following lyrics and structure them into sections.
IMPORTANT: You MUST ONLY use the following section names (you can append numbers like "Verse 1", "Chorus 2"):
- Intro
- Verse
- Pre-Chorus
- Chorus
- Final Chorus
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
8. Performance/production meta-instructions in brackets (e.g. [Guitar solo], [Whispered], [Anthemic], [Ad-lib]) are NOT section headers — include them verbatim as lyric lines with their brackets preserved.

Do NOT use any other section names. If a block of text is a structural section header (Verse, Chorus, Bridge, etc.), use it as the section name. If it is a performance meta-instruction, keep it as a line.

RHYME SCHEME DETECTION — CRITICAL RULES:
- Evaluate rhymes phonetically in the LANGUAGE of the lyrics, not in English.
- For French lyrics: feminine endings (-tion/-sion, -eur/-eur, -ment/-ment) and assonances (shared vowel sound) ARE valid rhymes.
- For all languages: near-rhymes, assonances, and imperfect rhymes count as rhyming.
- Assign FREE ONLY when you find absolutely zero recurring end-sound pattern across ANY pair of lines in the section.
- Prefer a structured scheme (AABB, ABAB, ABCB, AAAA, AABBA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, ABACBC) over FREE whenever at least 2 line-pairs share a sound.
- When in doubt between FREE and a structured scheme, choose the structured scheme.

For each section, identify the rhyme scheme using one of: AABB, ABAB, ABCB, AAAA, AABBA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, ABACBC, FREE.
For each line: exact lyric text (preserve [meta] brackets), rhyming syllables, rhyme identifier, exact syllable count, short core concept.

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
                      description: 'Rhyme scheme: AABB, ABAB, ABCB, AAAA, AABBA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, ABACBC, or FREE',
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

      if (controller.signal.aborted) return;

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

      const songWithIds: Section[] = sections.map((section: any) => {
        const lines: Section['lines'] = section.lines.map((line: any) => ({
          ...line,
          id: generateId(),
          isManual: true,
          isMeta: isPureMetaLine(line.text ?? ''),
          text: (line.text ?? '') as string,
        }));

        // AI returned FREE — run local fallback detector before accepting it
        let finalScheme: string = section.rhymeScheme || rhymeScheme;
        if (finalScheme.toUpperCase() === 'FREE') {
          const lyricTexts = lines.filter(l => !l.isMeta).map(l => l.text);
          const detected = detectRhymeSchemeLocally(lyricTexts);
          if (detected && detected.toUpperCase() !== 'FREE') {
            finalScheme = detected;
          }
        }

        return {
          ...section,
          name: cleanSectionName(section.name),
          id: generateId(),
          rhymeScheme: finalScheme,
          lines,
        };
      });

      const newStructure = sections.map((s: any) => cleanSectionName(s.name));
      updateSongAndStructureWithHistory(songWithIds, newStructure);

      requestAutoTitleGeneration();
      clearLineSelection();
      setIsPasteModalOpen(false);
      setPastedText('');
    } catch (error) {
      if (controller.signal.aborted) return;
      handleApiError(error, 'Failed to analyze lyrics. Please try again.');
    } finally {
      if (!controller.signal.aborted) setIsAnalyzing(false);
    }
  };

  return {
    isPasteModalOpen,
    setIsPasteModalOpen,
    pastedText,
    setPastedText,
    analyzePastedLyrics,
  };
};

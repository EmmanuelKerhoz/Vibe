import { useState, useRef, useEffect } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { cleanSectionName } from '../../utils/songUtils';
import { detectRhymeSchemeLocally } from '../../utils/rhymeSchemeUtils';
import { isPureMetaLine } from '../../utils/metaUtils';
import { generateId } from '../../utils/idUtils';
import { languageNameToCode } from '../../constants/langFamilyMap';
import type { Section } from '../../types';
import { abortCurrent, withAbort, isAbortError } from '../../utils/withAbort';
import { buildDetectLanguagePrompt } from '../../utils/promptUtils';
import { resolveUiLanguageName } from '../../utils/uiLangUtils';

type UsePasteImportParams = {
  rhymeScheme: string;
  uiLanguage: string;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  setTopic: (value: string) => void;
  setMood: (value: string) => void;
  currentSongLanguage?: string;
  onLanguageMismatch?: (lang: string) => void;
  requestAutoTitleGeneration: () => void;
  clearLineSelection: () => void;
  setIsAnalyzing: (value: boolean) => void;
};

const normalizeLanguageValue = (language: string): string =>
  (languageNameToCode(language) ?? language).trim().toLowerCase();

export const usePasteImport = ({
  rhymeScheme,
  uiLanguage,
  updateSongAndStructureWithHistory,
  setTopic,
  setMood,
  currentSongLanguage = '',
  onLanguageMismatch,
  requestAutoTitleGeneration,
  clearLineSelection,
  setIsAnalyzing,
}: UsePasteImportParams) => {
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => { return () => { abortCurrent(abortControllerRef); }; }, []);

  const uiLang = resolveUiLanguageName(uiLanguage);

  const analyzePastedLyrics = async () => {
    if (!pastedText.trim()) return;

    setIsAnalyzing(true);
    let wasAborted = false;
    try {
      await withAbort(abortControllerRef, async (nextSignal) => {
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
          signal: nextSignal,
        });

        if (nextSignal.aborted) {
          wasAborted = true;
          return;
        }

        const data = safeJsonParse<any>(response.text || '{}', {});

        if (data.topic) setTopic(data.topic);
        if (data.mood) setMood(data.mood);

        let detectedLanguage = typeof data.language === 'string' ? data.language.trim() : '';
        try {
          const detectionResponse = await generateContentWithRetry({
            model: AI_MODEL_NAME,
            contents: buildDetectLanguagePrompt(pastedText),
            signal: nextSignal,
          });
          if (nextSignal.aborted) {
            wasAborted = true;
            return;
          }
          detectedLanguage = detectionResponse.text?.trim() || detectedLanguage;
        } catch (error) {
          console.debug('Failed to detect pasted lyrics language, continuing with parsed result:', error);
        }

        if (
          detectedLanguage
          && currentSongLanguage.trim()
          && normalizeLanguageValue(detectedLanguage) !== normalizeLanguageValue(currentSongLanguage)
        ) {
          onLanguageMismatch?.(detectedLanguage);
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
      });
    } catch (error) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      handleApiError(error, 'Failed to analyze lyrics. Please try again.');
    } finally {
      if (!wasAborted) setIsAnalyzing(false);
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

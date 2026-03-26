import { useState, useRef, useEffect, useCallback } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse, handleApiError } from '../../utils/aiUtils';
import { cleanSectionName } from '../../utils/songUtils';
import { detectRhymeSchemeLocally } from '../../utils/rhymeSchemeUtils';
import { isPureMetaLine, unwrapBracketToken } from '../../utils/metaUtils';
import { generateId } from '../../utils/idUtils';
import { languageNameToCode } from '../../constants/langFamilyMap';
import type { Section } from '../../types';
import { abortCurrent, withAbort, isAbortError } from '../../utils/withAbort';
import { buildDetectLanguagePrompt } from '../../utils/promptUtils';
import { resolveUiLanguageName } from '../../utils/uiLangUtils';
import { SECTION_TYPE_DEFINITIONS } from '../../constants/sections';

type UsePasteImportParams = {
  rhymeScheme: string;
  uiLanguage: string;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  setTopic: (value: string) => void;
  setMood: (value: string) => void;
  currentSongLanguage?: string;
  onLanguageMismatch?: (lang: string) => void;
  onDetectedLanguage?: (language: string, sectionIds: string[]) => void;
  requestAutoTitleGeneration: () => void;
  clearLineSelection: () => void;
  setIsAnalyzing: (value: boolean) => void;
  setIsPasteModalOpen: (value: boolean) => void;
};

type PasteImportChunk = {
  displayLabel: string;
  nameHint: string;
  text: string;
};

export type PasteImportProgress = {
  current: number;
  total: number;
  currentLabel: string;
};

const normalizeLanguageValue = (language: string): string =>
  (languageNameToCode(language) ?? language).trim().toLowerCase();

const EMPTY_PROGRESS: PasteImportProgress = {
  current: 0,
  total: 0,
  currentLabel: '',
};
const MAX_METADATA_PROMPT_LENGTH = 6000;

const SECTION_RESPONSE_SCHEMA = {
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
};

const METADATA_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    mood: { type: Type.STRING },
    language: { type: Type.STRING },
  },
  required: ['topic', 'mood', 'language'],
};

const normalizeSectionHeaderCandidate = (line: string): string => {
  const trimmed = line.trim().replace(/^#+\s*/, '').replace(/[:：]\s*$/, '');
  const bracketValue = unwrapBracketToken(trimmed);
  return cleanSectionName(bracketValue ?? trimmed);
};

const normalizeSectionLookup = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getSectionHeaderHint = (line: string): string => {
  const normalized = normalizeSectionHeaderCandidate(line);
  const lookup = normalizeSectionLookup(normalized);
  if (!lookup) return '';

  const isStandaloneHeader = SECTION_TYPE_DEFINITIONS.some(({ aliases }) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeSectionLookup(alias);
      return lookup === normalizedAlias
        || lookup.match(new RegExp(`^${normalizedAlias}\\s+(?:\\d+|[ivx]+)$`, 'i')) !== null;
    }),
  );

  return isStandaloneHeader ? normalized : '';
};

const splitPastedLyricsIntoChunks = (text: string): PasteImportChunk[] => {
  const chunks: PasteImportChunk[] = [];
  const lines = text.split(/\r?\n/);
  let currentHeader = '';
  let currentLines: string[] = [];

  const pushChunk = () => {
    const chunkText = currentLines.join('\n').trim();
    if (!chunkText) return;
    const displayLabel = currentHeader || `Section ${chunks.length + 1}`;
    chunks.push({
      displayLabel,
      nameHint: currentHeader,
      text: chunkText,
    });
    currentLines = [];
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const headerHint = trimmed ? getSectionHeaderHint(trimmed) : '';

    if (headerHint) {
      pushChunk();
      currentHeader = headerHint;
      continue;
    }

    if (!trimmed) {
      if (currentLines.length > 0) {
        pushChunk();
        currentHeader = '';
      }
      continue;
    }

    currentLines.push(rawLine.trimEnd());
  }

  pushChunk();

  if (chunks.length > 0) return chunks;

  const fallbackText = text.trim();
  return fallbackText
    ? [{
      displayLabel: 'Section 1',
      nameHint: '',
      text: fallbackText,
    }]
    : [];
};

const buildSectionPrompt = (chunk: PasteImportChunk, uiLang: string): string => `Analyze this single lyrics section.
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
6. Performance/production meta-instructions in brackets (e.g. [Guitar solo], [Whispered], [Anthemic], [Ad-lib]) are NOT section headers — include them verbatim as lyric lines with their brackets preserved.
7. If a source section label is provided, normalize it to the closest allowed section name instead of inventing a new one.

RHYME SCHEME DETECTION — CRITICAL RULES:
- Evaluate rhymes phonetically in the language of the lyrics, not in English.
- Near-rhymes, assonances, and imperfect rhymes count as rhyming.
- Assign FREE ONLY when you find absolutely zero recurring end-sound pattern across ANY pair of lines in the section.
- Prefer a structured scheme over FREE whenever at least 2 line-pairs share a sound.

For this single section, return one JSON object with:
- "name": section name
- "rhymeScheme": one of AABB, ABAB, ABCB, AAAA, AABBA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, ABACBC, FREE
- "lines": array of lines with exact lyric text, rhyming syllables, rhyme identifier, exact syllable count, and short core concept

${chunk.nameHint ? `Source section label: ${chunk.nameHint}\n\n` : ''}Lyrics:
${chunk.text}`;

const buildMetadataPrompt = (text: string, uiLang: string): string => `Analyze these lyrics and return a JSON object with:
- "topic": the overall topic in ${uiLang}
- "mood": the overall mood in ${uiLang}
- "language": the main lyric language in English (e.g. "English", "French", "Yoruba")

Use only the provided lyrics. Do not generate new content.

Lyrics:
${text.substring(0, MAX_METADATA_PROMPT_LENGTH)}`;

export const usePasteImport = ({
  rhymeScheme,
  uiLanguage,
  updateSongAndStructureWithHistory,
  setTopic,
  setMood,
  currentSongLanguage = '',
  onLanguageMismatch,
  onDetectedLanguage,
  requestAutoTitleGeneration,
  clearLineSelection,
  setIsAnalyzing,
  setIsPasteModalOpen,
}: UsePasteImportParams) => {
  const [pastedText, setPastedText] = useState('');
  const [hasClipboardText, setHasClipboardText] = useState(false);
  const [importProgress, setImportProgress] = useState<PasteImportProgress>(EMPTY_PROGRESS);

  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => { return () => { abortCurrent(abortControllerRef); }; }, []);

  const uiLang = resolveUiLanguageName(uiLanguage);
  const refreshClipboardText = useCallback(async () => {
    if (
      typeof window === 'undefined'
      || !window.isSecureContext
      || typeof navigator === 'undefined'
      || !navigator.clipboard?.readText
    ) {
      setHasClipboardText(false);
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      setHasClipboardText(Boolean(clipboardText.trim()));
    } catch {
      setHasClipboardText(false);
    }
  }, []);

  useEffect(() => {
    void refreshClipboardText();

    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const handleFocus = () => { void refreshClipboardText(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshClipboardText();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshClipboardText]);

  const canPasteLyrics = Boolean(pastedText.trim()) || hasClipboardText;

  const analyzePastedLyrics = async () => {
    if (!pastedText.trim()) return;

    const chunks = splitPastedLyricsIntoChunks(pastedText);
    if (chunks.length === 0) return;

    setIsAnalyzing(true);
    setImportProgress({
      current: 0,
      total: chunks.length,
      currentLabel: chunks[0]?.displayLabel ?? '',
    });
    let wasAborted = false;
    try {
      await withAbort(abortControllerRef, async (nextSignal) => {
        const analyzedSections: Array<{
          name: string;
          rhymeScheme?: string;
          lines: Array<{ text?: string; rhymingSyllables?: string; rhyme?: string; syllables?: number; concept?: string }>;
        }> = [];

        for (const [index, chunk] of chunks.entries()) {
          setImportProgress({
            current: index + 1,
            total: chunks.length,
            currentLabel: chunk.displayLabel,
          });

          const response = await generateContentWithRetry({
            model: AI_MODEL_NAME,
            contents: buildSectionPrompt(chunk, uiLang),
            config: {
              responseMimeType: 'application/json',
              responseSchema: SECTION_RESPONSE_SCHEMA,
            },
            signal: nextSignal,
          });

          if (nextSignal.aborted) {
            wasAborted = true;
            return;
          }

          const section = safeJsonParse<{
            name?: string;
            rhymeScheme?: string;
            lines?: Array<{ text?: string; rhymingSyllables?: string; rhyme?: string; syllables?: number; concept?: string }>;
          }>(response.text || '{}', {});

          analyzedSections.push({
            name: section.name?.trim() || chunk.nameHint || chunk.displayLabel,
            rhymeScheme: section.rhymeScheme,
            lines: section.lines ?? [],
          });
        }

        let topicFromImport = '';
        let moodFromImport = '';
        let detectedLanguage = '';

        try {
          const metadataResponse = await generateContentWithRetry({
            model: AI_MODEL_NAME,
            contents: buildMetadataPrompt(pastedText, uiLang),
            config: {
              responseMimeType: 'application/json',
              responseSchema: METADATA_RESPONSE_SCHEMA,
            },
            signal: nextSignal,
          });
          if (nextSignal.aborted) {
            wasAborted = true;
            return;
          }

          const metadata = safeJsonParse<{
            topic?: string;
            mood?: string;
            language?: string;
          }>(metadataResponse.text || '{}', {});

          topicFromImport = typeof metadata.topic === 'string' ? metadata.topic.trim() : '';
          moodFromImport = typeof metadata.mood === 'string' ? metadata.mood.trim() : '';
          detectedLanguage = typeof metadata.language === 'string' ? metadata.language.trim() : '';
        } catch (error) {
          console.debug('Failed to analyze pasted lyrics metadata, continuing with section results:', error);
        }

        if (topicFromImport) setTopic(topicFromImport);
        if (moodFromImport) setMood(moodFromImport);

        if (!detectedLanguage) {
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
        }

        if (
          detectedLanguage
          && currentSongLanguage.trim()
          && normalizeLanguageValue(detectedLanguage) !== normalizeLanguageValue(currentSongLanguage)
        ) {
          onLanguageMismatch?.(detectedLanguage);
        }

        const sections = analyzedSections;
        if (sections.length === 0) {
          throw new Error('No sections could be extracted. Please check the lyrics format.');
        }

        const songWithIds: Section[] = sections.map((section) => {
          const lines: Section['lines'] = (section.lines ?? []).map((line) => ({
            id: generateId(),
            text: (line.text ?? '') as string,
            rhymingSyllables: line.rhymingSyllables ?? '',
            rhyme: line.rhyme ?? '',
            syllables: line.syllables ?? 0,
            concept: line.concept ?? '',
            isManual: true,
            isMeta: isPureMetaLine(line.text ?? ''),
          }));

          let finalScheme: string = section.rhymeScheme || rhymeScheme;
          if (finalScheme.toUpperCase() === 'FREE') {
            // Derive scheme from per-line AI rhyme labels when available
            const lyricLines = lines.filter(l => !l.isMeta);
            const aiLabels = lyricLines.map(l => (l.rhyme || '').toUpperCase());
            const labelCounts: Record<string, number> = {};
            for (const label of aiLabels) {
              if (label && label !== 'X') labelCounts[label] = (labelCounts[label] ?? 0) + 1;
            }
            const hasAiRhymes = Object.values(labelCounts).some(count => count >= 2);
            if (hasAiRhymes) {
              finalScheme = aiLabels.map(l => (l && l !== 'X') ? l : 'X').join('');
            } else {
              // Fall back to local graphemic detection
              const lyricTexts = lyricLines.map(l => l.text);
              const detected = detectRhymeSchemeLocally(lyricTexts);
              if (detected && detected.toUpperCase() !== 'FREE') {
                finalScheme = detected;
              }
            }
          }

          return {
            ...section,
            name: cleanSectionName(section.name),
            id: generateId(),
            rhymeScheme: finalScheme,
            lines,
            ...(detectedLanguage ? { language: detectedLanguage } : {}),
          };
        });

        const newStructure = sections.map((s) => cleanSectionName(s.name));
        updateSongAndStructureWithHistory(songWithIds, newStructure);

        if (detectedLanguage) {
          onDetectedLanguage?.(detectedLanguage, songWithIds.map(s => s.id));
        }

        requestAutoTitleGeneration();
        clearLineSelection();
        setIsPasteModalOpen(false);
        setPastedText('');
      });
    } catch (error: unknown) {
      if (isAbortError(error)) {
        wasAborted = true;
        return;
      }
      handleApiError(error, 'Failed to analyze lyrics. Please try again.');
    } finally {
      if (!wasAborted) {
        setIsAnalyzing(false);
        setImportProgress(EMPTY_PROGRESS);
      }
    }
  };

  return {
    canPasteLyrics,
    pastedText,
    setPastedText,
    importProgress,
    analyzePastedLyrics,
  };
};

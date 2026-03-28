import { Type } from '@google/genai';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse } from '../../utils/aiUtils';
import { languageNameToCode } from '../../constants/langFamilyMap';
import { isSectionHeader } from '../../utils/metaUtils';
import { mapSongWithPreservedIds, mergeAiSectionIntoCurrent } from '../../utils/songMergeUtils';
import { matchRhymeSchemeAcrossLang } from '../../utils/adaptationUtils';
import { reverseTranslateLines, reviewTranslationFidelity } from '../../utils/llmPipelineUtils';
import { buildDetectLanguagePrompt } from '../../utils/promptUtils';
import type { Line, Section } from '../../types';

type AdaptationLinePayload = Partial<Line>;
type AdaptationSectionPayload = Partial<Omit<Section, 'lines'>> & { lines?: AdaptationLinePayload[] };

type ParseAdaptationResponseParams =
  | {
      kind: 'song';
      responseText: string;
      sourceSong: Section[];
      newLanguage: string;
    }
  | {
      kind: 'section';
      responseText: string;
      section: Section;
      newLanguage: string;
    };

const adaptationLineSchema = {
  type: Type.OBJECT,
  properties: {
    text:             { type: Type.STRING },
    rhymingSyllables: { type: Type.STRING },
    rhyme:            { type: Type.STRING },
    syllables:        { type: Type.INTEGER },
    concept:          { type: Type.STRING },
  },
  required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
};

const adaptationSectionSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    rhymeScheme: { type: Type.STRING },
    lines: {
      type: Type.ARRAY,
      items: adaptationLineSchema,
    },
  },
  required: ['name', 'lines'],
};

export const getAdaptationResponseSchema = (kind: 'song' | 'section') =>
  kind === 'song'
    ? {
        type: Type.ARRAY,
        items: adaptationSectionSchema,
      }
    : adaptationSectionSchema;

export const getLineAdaptationResponseSchema = () => adaptationLineSchema;

export const getSourceLines = (sections: Section[]) =>
  sections.flatMap(section =>
    section.lines
      .filter(line => !line.isMeta && !isSectionHeader(line.text.replace(/^\[|\]$/g, '').trim()))
      .map(line => line.text)
  );

export interface SourceLineRef {
  sectionIndex: number;
  lineIndex: number;
  lineId: string;
  text: string;
}

/** Returns non-meta lyric lines with their section/line coordinates and IDs. */
export const getSourceLineRefs = (sections: Section[]): SourceLineRef[] =>
  sections.flatMap((section, si) =>
    section.lines
      .map((line, li) => ({ sectionIndex: si, lineIndex: li, lineId: line.id, text: line.text, isMeta: line.isMeta, raw: line.text.replace(/^\[|\]$/g, '').trim() }))
      .filter(entry => !entry.isMeta && !isSectionHeader(entry.raw))
      .map(({ sectionIndex, lineIndex, lineId, text }) => ({ sectionIndex, lineIndex, lineId, text }))
  );

export interface DetectionResult {
  /** All distinct languages found, sorted by frequency (most used first). */
  languages: string[];
  /** Per-line language names keyed by line ID. */
  lineLanguageMap: Record<string, string>;
}

export const detectSongLanguage = async (song: Section[], signal?: AbortSignal): Promise<DetectionResult> => {
  const lineRefs = getSourceLineRefs(song);
  const songText = lineRefs.map(r => r.text).join('\n');
  if (!songText.trim()) return { languages: [], lineLanguageMap: {} };

  const response = await generateContentWithRetry({
    model: AI_MODEL_NAME,
    contents: buildDetectLanguagePrompt(songText),
    signal,
  });

  const text = response.text?.trim() || '';

  // Try parsing as JSON (new multi-language format)
  try {
    const parsed = JSON.parse(text) as { languages?: unknown; lineLanguages?: unknown };
    const languages = Array.isArray(parsed.languages)
      ? (parsed.languages as string[]).filter(l => typeof l === 'string' && l.trim())
      : [];
    const lineLanguages = Array.isArray(parsed.lineLanguages)
      ? (parsed.lineLanguages as string[]).filter(l => typeof l === 'string')
      : [];

    // Build lineId → language map
    const lineLanguageMap: Record<string, string> = {};
    for (let i = 0; i < Math.min(lineRefs.length, lineLanguages.length); i++) {
      const lang = lineLanguages[i]?.trim();
      const lineId = lineRefs[i]?.lineId;
      if (lang && lineId) lineLanguageMap[lineId] = lang;
    }

    return {
      languages: languages.length > 0 ? languages : ['English'],
      lineLanguageMap,
    };
  } catch {
    // Fallback: old-style plain text response (single language name)
    return {
      languages: [text || 'English'],
      lineLanguageMap: {},
    };
  }
};

export const getIpaEnhancedPrompt = async (
  sections: Section[],
  sourceLanguage: string,
  newLanguage: string,
  signal: AbortSignal,
  sectionName?: string,
) => {
  const sourceLines = getSourceLines(sections);
  const sourceLangCode = languageNameToCode(sourceLanguage);
  const targetLangCode = languageNameToCode(newLanguage);

  if (!sourceLangCode || !targetLangCode || sourceLines.length === 0) {
    return '';
  }

  try {
    const adaptationResult = await matchRhymeSchemeAcrossLang(
      sourceLines,
      sourceLangCode,
      targetLangCode,
      signal
    );
    if (signal.aborted || !adaptationResult.success) {
      return '';
    }

    if (sectionName) {
      console.debug('IPA constraints applied for section:', sectionName, adaptationResult.sourceScheme);
    } else {
      console.debug('IPA constraints applied:', adaptationResult.sourceScheme);
    }
    return `\n\n${adaptationResult.constrainedPrompt}`;
  } catch (error) {
    if (sectionName) {
      console.debug('IPA pipeline not available for section, continuing with standard prompt:', error);
    } else {
      console.debug('IPA pipeline not available, continuing with standard prompt:', error);
    }
    return '';
  }
};

export const parseAdaptationResponse = (
  params: ParseAdaptationResponseParams,
): Section[] => {
  if (params.kind === 'song') {
    const newSongData = safeJsonParse<AdaptationSectionPayload[]>(params.responseText || '[]', []);
    if (newSongData.length === 0) throw new Error('Empty adaptation response');
    return mapSongWithPreservedIds(newSongData, params.sourceSong, params.newLanguage);
  }

  const newSectionData = safeJsonParse<AdaptationSectionPayload>(params.responseText || '{}', {});
  if (!newSectionData.name) throw new Error('Empty section adaptation response');
  return [mergeAiSectionIntoCurrent(params.section, newSectionData, params.newLanguage)];
};

/**
 * Reverse-translates adapted lyrics literally back to the source language.
 * P6-fix: accepts AbortSignal so the caller's controller can cancel mid-pipeline.
 */
export const reverseTranslate = async (
  adaptedSong: Section[],
  fromLanguage: string,
  toLanguage: string,
  signal?: AbortSignal,
): Promise<string[]> => {
  const lines = adaptedSong.flatMap(s =>
    s.lines.filter(l => !l.isMeta).map(l => l.text)
  );
  return reverseTranslateLines(lines, fromLanguage, toLanguage, signal);
};

/**
 * Reviews the fidelity of an adaptation via LLM scoring (0–100).
 * P6-fix: accepts AbortSignal so the caller's controller can cancel mid-pipeline.
 */
export const reviewFidelity = async (
  originalSong: Section[],
  reversedLines: string[],
  targetLanguage: string,
  sourceLang: string,
  signal?: AbortSignal,
): Promise<{ score: number; warnings: string[] }> => {
  const originalLines = originalSong
    .flatMap(s => s.lines.filter(l => !l.isMeta).map(l => l.text));

  try {
    const result = await reviewTranslationFidelity(
      originalLines,
      reversedLines,
      targetLanguage,
      sourceLang,
      signal,
    );

    if (
      result &&
      typeof result === 'object' &&
      typeof result.score === 'number' &&
      Array.isArray(result.warnings)
    ) {
      return result;
    }
  } catch {
    // Fall through to explicit zero-score fallback below.
  }

  return {
    score: 0,
    warnings: ['Fidelity review failed: invalid or unavailable review response'],
  };
};

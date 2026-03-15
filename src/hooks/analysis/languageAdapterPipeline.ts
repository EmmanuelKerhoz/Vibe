// ---------------------------------------------------------------------------
// Language Adapter – stateless async pipeline helpers
// ---------------------------------------------------------------------------

import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse } from '../../utils/aiUtils';
import type { Section } from '../../types';

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
  if (lines.length === 0) return [];

  const response = await getAi().models.generateContent({
    model: AI_MODEL_NAME,
    contents: [
      `You are a professional literal translator. Translate the following ${fromLanguage} lyrics LITERALLY (word-for-word, no adaptation) into ${toLanguage}.`,
      `Return a JSON array of strings, one translated string per input line, preserving order exactly.`,
      `Input lines (${fromLanguage}):`,
      JSON.stringify(lines),
    ].join('\n'),
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    signal,
  });
  return safeJsonParse<string[]>(response.text || '[]', []);
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

  const reviewPrompt = [
    `You are a senior lyric consultant reviewing the conceptual fidelity of a song adaptation from ${sourceLang} to ${targetLanguage}.`,
    ``,
    `You have:`,
    `- ORIGINAL lyrics in ${sourceLang}`,
    `- REVERSE TRANSLATION of the ${targetLanguage} adaptation (literal, back into ${sourceLang})`,
    ``,
    `Your task: assess whether the ${targetLanguage} adaptation preserved the conceptual intent of the original.`,
    ``,
    `Return a JSON object with:`,
    `- "score": integer 0-100 (100 = perfect fidelity, 0 = completely lost the meaning)`,
    `- "warnings": array of strings describing specific intent losses (empty array if none)`,
    ``,
    `ORIGINAL (${sourceLang}):`,
    JSON.stringify(originalLines),
    ``,
    `REVERSE TRANSLATION (back to ${sourceLang}):`,
    JSON.stringify(reversedLines),
  ].join('\n');

  const response = await getAi().models.generateContent({
    model: AI_MODEL_NAME,
    contents: reviewPrompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score:    { type: Type.INTEGER },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['score', 'warnings'],
      },
    },
    signal,
  });

  return safeJsonParse<{ score: number; warnings: string[] }>(
    response.text || '{"score":50,"warnings":[]}',
    { score: 50, warnings: [] },
  );
};

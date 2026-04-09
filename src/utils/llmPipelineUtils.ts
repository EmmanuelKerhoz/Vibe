import { Type } from '@google/genai';
import { z } from 'zod';
import { AI_MODEL_NAME, generateContentWithRetry, safeJsonParse } from './aiUtils';

const buildReverseTranslatePrompt = (
  lines: string[],
  fromLanguage: string,
  toLanguage: string,
): string => [
  `You are a professional literal translator. Translate the following ${fromLanguage} lyrics LITERALLY (word-for-word, no adaptation) into ${toLanguage}.`,
  `Return a JSON array of strings, one translated string per input line, preserving order exactly.`,
  `Input lines (${fromLanguage}):`,
  JSON.stringify(lines),
].join('\n');

const buildFidelityReviewPrompt = (
  originalLines: string[],
  reversedLines: string[],
  targetLanguage: string,
  sourceLang: string,
): string => [
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

// ─── Zod schemas for safeJsonParse validation ────────────────────────────────

const ReverseTranslateSchema = z.array(z.string());

const FidelityReviewSchema = z.object({
  score: z.number().int().min(0).max(100),
  warnings: z.array(z.string()),
});

// ─── Pipeline functions ───────────────────────────────────────────────────────

export const reverseTranslateLines = async (
  lines: string[],
  fromLanguage: string,
  toLanguage: string,
  signal?: AbortSignal,
): Promise<string[]> => {
  if (lines.length === 0) return [];

  const response = await generateContentWithRetry({
    model: AI_MODEL_NAME,
    contents: buildReverseTranslatePrompt(lines, fromLanguage, toLanguage),
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    // Conditional spread: omit signal when undefined (exactOptionalPropertyTypes).
    ...(signal !== undefined && { signal }),
  });

  return safeJsonParse<string[]>(response.text || '[]', [], ReverseTranslateSchema);
};

export const reviewTranslationFidelity = async (
  originalLines: string[],
  reversedLines: string[],
  targetLanguage: string,
  sourceLang: string,
  signal?: AbortSignal,
): Promise<{ score: number; warnings: string[] }> => {
  const response = await generateContentWithRetry({
    model: AI_MODEL_NAME,
    contents: buildFidelityReviewPrompt(originalLines, reversedLines, targetLanguage, sourceLang),
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['score', 'warnings'],
      },
    },
    // Conditional spread: omit signal when undefined (exactOptionalPropertyTypes).
    ...(signal !== undefined && { signal }),
  });

  return safeJsonParse<{ score: number; warnings: string[] }>(
    response.text || '{"score":0,"warnings":["Review failed: empty or invalid AI response"]}',
    { score: 0, warnings: ['Review failed: could not parse AI response'] },
    FidelityReviewSchema,
  );
};

export const llmPipelinePromptBuilders = {
  buildReverseTranslatePrompt,
  buildFidelityReviewPrompt,
};

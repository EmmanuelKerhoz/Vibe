import { reverseTranslateLines, reviewTranslationFidelity } from '../../utils/llmPipelineUtils';
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
  return reviewTranslationFidelity(originalLines, reversedLines, targetLanguage, sourceLang, signal);
};

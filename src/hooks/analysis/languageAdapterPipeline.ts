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

/**
 * Adaptation utilities for cross-language translation with rhyme preservation
 * Implements constraint-based translation that maintains rhyme schemes across languages
 */

import { runIPAPipelineBatch, compareTextsWithIPA, type IPAPipelineResult } from './ipaPipeline';
import { buildRhymeConstrainedPrompt } from './promptUtils';
import type { Line } from '../types';

/**
 * Result of cross-language rhyme scheme matching
 */
export interface AdaptationResult {
  success: boolean;
  sourceScheme: string;
  targetScheme: string;
  constrainedPrompt: string;
  sourceAnalysis: IPAPipelineResult[];
  validatedLines?: string[];
  error?: string;
}

const createAbortedAdaptationResult = (): AdaptationResult => ({
  success: false,
  sourceScheme: '',
  targetScheme: '',
  constrainedPrompt: '',
  sourceAnalysis: [],
  error: 'Operation aborted',
});

const createEmptyAdaptationResult = (): AdaptationResult => ({
  success: true,
  sourceScheme: '',
  targetScheme: '',
  constrainedPrompt: '',
  sourceAnalysis: [],
});

/**
 * Validates a translated line against its expected rhyme group
 *
 * @param translatedLine - The translated line to validate
 * @param targetLang - Target language code
 * @param expectedRhymeNucleus - Expected rhyme nucleus from source
 * @param peerLines - Other lines in the same rhyme group
 * @param threshold - Similarity threshold (default 0.75)
 * @returns Promise<boolean> - Whether the line passes validation
 */
export const validateTranslatedLineRhyme = async (
  translatedLine: string,
  targetLang: string,
  expectedRhymeNucleus: string,
  peerLines: string[],
  threshold = 0.75
): Promise<boolean> => {
  // If no peer lines to compare against, consider it valid
  if (peerLines.length === 0) {
    return true;
  }

  // Compare against each peer line in the same rhyme group
  for (const peerLine of peerLines) {
    const similarity = await compareTextsWithIPA(translatedLine, peerLine, targetLang);
    if (similarity.score >= threshold) {
      return true; // Found at least one good rhyme match
    }
  }

  return false; // No good matches found
};

/**
 * Matches rhyme scheme across languages with phonemic constraints
 *
 * This is the main function for cross-language adaptation:
 * 1. Extracts source rhyme scheme via IPA pipeline
 * 2. Builds a translation prompt with per-line rhyme constraints in target language
 * 3. Provides validation function for each translated line
 *
 * @param sourceLines - Array of source text lines
 * @param sourceLang - Source language code (e.g., 'en', 'fr')
 * @param targetLang - Target language code (e.g., 'ee', 'fr')
 * @param signal - Optional AbortSignal to cancel the operation
 * @returns Promise<AdaptationResult> - Complete adaptation result with constraints
 */
export const matchRhymeSchemeAcrossLang = async (
  sourceLines: string[],
  sourceLang: string,
  targetLang: string,
  signal?: AbortSignal
): Promise<AdaptationResult> => {
  if (signal?.aborted) {
    return createAbortedAdaptationResult();
  }

  // Validate inputs
  if (!sourceLines || sourceLines.length === 0) {
    return createEmptyAdaptationResult();
  }

  if (!sourceLang || !targetLang) {
    return {
      success: false,
      sourceScheme: '',
      targetScheme: '',
      constrainedPrompt: '',
      sourceAnalysis: [],
      error: 'Source and target language codes are required',
    };
  }

  try {
    // Step 1: Extract source rhyme scheme via IPA pipeline
    const sourceAnalysis = await runIPAPipelineBatch(sourceLines, sourceLang, signal);

    // Check if aborted after IPA pipeline
    if (signal?.aborted) {
      return createAbortedAdaptationResult();
    }

    // Build rhyme scheme from source analysis
    // Group lines by rhyme nucleus similarity
    const rhymeGroups = new Map<string, number[]>();
    const rhymeLetters: string[] = [];
    let nextLetter = 0;
    const LETTERS = 'ABCDEFGH';

    for (let i = 0; i < sourceAnalysis.length; i++) {
      const result = sourceAnalysis[i];
      if (!result || !result.success) {
        rhymeLetters.push('X');
        continue;
      }

      const rn = result.rhymeNucleus;

      // Check if this rhyme nucleus matches any existing group
      let matchedLetter: string | null = null;
      for (const [existingRN, indices] of rhymeGroups.entries()) {
        // Simple comparison for now - in production, could use similarity threshold
        if (existingRN === rn && rn !== '') {
          matchedLetter = rhymeLetters[indices[0]!]!;
          indices.push(i);
          break;
        }
      }

      if (matchedLetter) {
        rhymeLetters.push(matchedLetter);
      } else {
        const letter = LETTERS[nextLetter] ?? String.fromCharCode(65 + nextLetter);
        rhymeLetters.push(letter);
        rhymeGroups.set(rn, [i]);
        nextLetter++;
      }
    }

    const sourceScheme = rhymeLetters.join('');

    // Step 2: Build translation prompt with rhyme constraints
    // Convert source lines to Line objects for buildRhymeConstrainedPrompt
    const linesAsObjects: Line[] = sourceLines.map((text, idx) => ({
      id: `src-${idx}`,
      text,
      rhymingSyllables: sourceAnalysis[idx]?.rhymeNucleus || '',
      rhyme: rhymeLetters[idx] || '',
      syllables: sourceAnalysis[idx]?.syllables.length || 0,
      concept: '',
    }));

    // Build base prompt for target language
    let constrainedPrompt = `CROSS-LANGUAGE TRANSLATION TASK\n\n`;
    constrainedPrompt += `Source language: ${sourceLang}\n`;
    constrainedPrompt += `Target language: ${targetLang}\n`;
    constrainedPrompt += `Source rhyme scheme: ${sourceScheme}\n\n`;
    constrainedPrompt += `IMPORTANT: Maintain the rhyme scheme in the translation.\n`;
    constrainedPrompt += `Each line must rhyme with the same lines as in the source.\n\n`;

    constrainedPrompt += `Source lines with phonemic analysis:\n`;
    for (let i = 0; i < sourceLines.length; i++) {
      const analysis = sourceAnalysis[i];
      const rhymeLetter = rhymeLetters[i];
      constrainedPrompt += `${i + 1}. "${sourceLines[i]}" (rhyme: ${rhymeLetter})`;
      if (analysis?.success) {
        constrainedPrompt += ` [RN: /${analysis.rhymeNucleus}/, ${analysis.syllables.length} syllables]`;
      }
      constrainedPrompt += `\n`;
    }

    constrainedPrompt += `\nRHYME CONSTRAINTS:\n`;
    for (const [letter, indices] of Array.from(rhymeGroups.entries())) {
      if (indices.length > 1) {
        const firstIndex = indices[0]!;
        const rhymeLetter = rhymeLetters[firstIndex];
        constrainedPrompt += `Lines with rhyme "${rhymeLetter}" must rhyme together in ${targetLang}\n`;
        constrainedPrompt += `  Lines: ${indices.map(i => i + 1).join(', ')}\n`;
      }
    }

    constrainedPrompt += `\nGenerate the translation maintaining these rhyme relationships.`;

    return {
      success: true,
      sourceScheme,
      targetScheme: sourceScheme, // Target should match source scheme
      constrainedPrompt,
      sourceAnalysis,
    };
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
      return createAbortedAdaptationResult();
    }
    return {
      success: false,
      sourceScheme: '',
      targetScheme: '',
      constrainedPrompt: '',
      sourceAnalysis: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Validates a complete set of translated lines against source rhyme scheme
 *
 * @param translatedLines - Array of translated lines
 * @param sourceScheme - Source rhyme scheme (e.g., 'AABB')
 * @param targetLang - Target language code
 * @param threshold - Similarity threshold (default 0.75)
 * @returns Promise<boolean[]> - Validation result for each line
 */
export const validateTranslatedLines = async (
  translatedLines: string[],
  sourceScheme: string,
  targetLang: string,
  threshold = 0.75
): Promise<boolean[]> => {
  if (translatedLines.length !== sourceScheme.length) {
    throw new Error('Number of translated lines must match source scheme length');
  }

  // Group lines by rhyme letter
  const rhymeGroups = new Map<string, string[]>();
  for (let i = 0; i < sourceScheme.length; i++) {
    const letter = sourceScheme[i];
    if (!letter || letter === 'X') continue;

    if (!rhymeGroups.has(letter)) {
      rhymeGroups.set(letter, []);
    }
    rhymeGroups.get(letter)!.push(translatedLines[i]!);
  }

  // Validate each line against its rhyme group
  const validationResults: boolean[] = [];
  for (let i = 0; i < translatedLines.length; i++) {
    const letter = sourceScheme[i];
    if (!letter || letter === 'X') {
      validationResults.push(true); // Lines without rhyme constraints always pass
      continue;
    }

    const peerLines = rhymeGroups.get(letter)?.filter(line => line !== translatedLines[i]) || [];
    const isValid = await validateTranslatedLineRhyme(
      translatedLines[i]!,
      targetLang,
      '', // We don't have expected RN here, rely on peer comparison
      peerLines,
      threshold
    );
    validationResults.push(isValid);
  }

  return validationResults;
};

/**
 * IPA Pipeline Integration
 * Orchestrates the complete 5-step phonemic processing pipeline
 * Based on docs_fusion_optimal.md specification
 *
 * Pipeline Steps:
 * 1. Normalization/tokenization (already in syllableUtils)
 * 2. G2P → IPA (g2pUtils + phonemizeClient)
 * 3. Syllabification phonémique (ipaSyllabification)
 * 4. Extraction Rhyme Nucleus (ipaSyllabification)
 * 5. Scoring IPA (ipaUtils)
 */

import { getAlgoFamily, getFamilyConfig, type AlgoFamily } from '../constants/langFamilyMap';
import { phonemizeText, type PhonemeResponse } from './phonemizeClient';
import { graphemeToIPA } from './g2pUtils';
import { syllabifyIPA, extractRhymeNucleus, type IPASyllable } from './ipaSyllabification';
import { calculateRhymeSimilarity, calculateRhymeSimilarityWithWeight, type RhymeSimilarityResult } from './ipaUtils';
import { finalizeDetectedRhymeScheme, RHYME_SCHEME_LETTERS } from './rhymeSchemeUtils';

const createAbortError = () => {
  const error = new Error('Operation aborted');
  error.name = 'AbortError';
  return error;
};

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw createAbortError();
  }
};

const isAbortError = (error: unknown) =>
  (error instanceof DOMException && error.name === 'AbortError')
  || (error instanceof Error && error.name === 'AbortError');

/**
 * Complete IPA pipeline result
 */
export interface IPAPipelineResult {
  success: boolean;
  text: string;
  langCode: string;
  family: AlgoFamily;
  ipa: string;
  syllables: IPASyllable[];
  rhymeNucleus: string;
  method: 'service' | 'client-fallback' | 'graphemic';
  lowResource: boolean;
}

/**
 * Run the complete IPA pipeline for a text segment
 * Step 1-4 implementation
 *
 * @param text - Input text to process
 * @param langCode - ISO 639 language code
 * @returns Complete pipeline result with IPA, syllables, and rhyme nucleus
 */
export const runIPAPipeline = async (
  text: string,
  langCode: string,
  signal?: AbortSignal,
): Promise<IPAPipelineResult> => {
  throwIfAborted(signal);

  // Step 1: Normalization (already handled in input)
  const normalized = text.normalize('NFD').trim();

  if (!normalized) {
    return {
      success: false,
      text,
      langCode,
      family: 'ALGO-ROM',
      ipa: '',
      syllables: [],
      rhymeNucleus: '',
      method: 'graphemic',
      lowResource: true,
    };
  }

  // Determine language family
  const family = getAlgoFamily(langCode) || 'ALGO-ROM';
  const config = getFamilyConfig(langCode);

  // Step 2: G2P conversion (try service first, then client fallback)
  let ipaText = '';
  let syllables: IPASyllable[] = [];
  let method: 'service' | 'client-fallback' | 'graphemic' = 'graphemic';
  let lowResource = true;

  // Try phonemization service
  try {
    const serviceResult = await phonemizeText(normalized, langCode, signal);
    if (serviceResult) {
      ipaText = serviceResult.ipa;
      method = 'service';
      lowResource = serviceResult.low_resource;

      // Convert service syllables to IPASyllable format.
      // Conditional spread for optional props (tone, stress) to satisfy
      // exactOptionalPropertyTypes: IPASyllable.tone?: string excludes undefined.
      if (serviceResult.syllables && serviceResult.syllables.length > 0) {
        syllables = serviceResult.syllables.map(s => ({
          onset: s.onset,
          nucleus: s.nucleus,
          coda: s.coda,
          ...(s.tone !== undefined && { tone: s.tone }),
          ...(s.stress !== undefined && { stress: s.stress }),
        }));
      }
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    // Service unavailable, will fall back to client-side
    console.debug('Phonemization service unavailable, using client fallback');
  }

  // Client-side fallback if service didn't work
  throwIfAborted(signal);

  if (!ipaText) {
    ipaText = graphemeToIPA(normalized, family);
    method = 'client-fallback';
    lowResource = true;
  }

  // Step 3: Syllabification (if not provided by service)
  if (syllables.length === 0 && ipaText) {
    syllables = syllabifyIPA(ipaText, family);
  }

  // Step 4: Extract rhyme nucleus
  const rhymeNucleus = syllables.length > 0
    ? extractRhymeNucleus(syllables, family)
    : '';

  throwIfAborted(signal);

  return {
    success: true,
    text: normalized,
    langCode,
    family,
    ipa: ipaText,
    syllables,
    rhymeNucleus,
    method,
    lowResource,
  };
};

/**
 * Compare two texts using the full IPA pipeline
 * Step 5 implementation
 *
 * @param text1 - First text
 * @param text2 - Second text
 * @param langCode - ISO 639 language code
 * @returns Rhyme similarity result with quality classification
 */
export const compareTextsWithIPA = async (
  text1: string,
  text2: string,
  langCode: string
): Promise<RhymeSimilarityResult> => {
  // Run pipeline for both texts
  const [result1, result2] = await Promise.all([
    runIPAPipeline(text1, langCode),
    runIPAPipeline(text2, langCode),
  ]);

  // If either failed, return no match
  if (!result1.success || !result2.success) {
    return {
      score: 0,
      quality: 'none',
      distance: Infinity,
      method: 'exact',
    };
  }

  // Compare rhyme nuclei using feature-weighted Levenshtein
  const rn1 = result1.rhymeNucleus || result1.ipa;
  const rn2 = result2.rhymeNucleus || result2.ipa;

  // For CRV family (Hausa etc.), use weight-aware scoring
  if (result1.family === 'ALGO-CRV' && result2.family === 'ALGO-CRV') {
    // Extract weight from last syllable (where rhyme nucleus comes from)
    const weight1 = result1.syllables.length > 0
      ? result1.syllables[result1.syllables.length - 1]?.weight
      : undefined;
    const weight2 = result2.syllables.length > 0
      ? result2.syllables[result2.syllables.length - 1]?.weight
      : undefined;

    return calculateRhymeSimilarityWithWeight(rn1, rn2, weight1, weight2, true);
  }

  // For other families, use standard similarity
  return calculateRhymeSimilarity(rn1, rn2, true);
};

/**
 * Batch process multiple texts through the IPA pipeline
 * Useful for processing all lines in a section
 */
export const runIPAPipelineBatch = async (
  texts: string[],
  langCode: string,
  signal?: AbortSignal,
): Promise<IPAPipelineResult[]> => {
  return Promise.all(texts.map(text => runIPAPipeline(text, langCode, signal)));
};

/**
 * Compare multiple texts for rhyme detection
 * Returns pairwise similarity matrix
 */
export const compareMultipleTexts = async (
  texts: string[],
  langCode: string
): Promise<RhymeSimilarityResult[][]> => {
  const results = await runIPAPipelineBatch(texts, langCode);

  // Build similarity matrix
  const matrix: RhymeSimilarityResult[][] = [];
  for (let i = 0; i < results.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < results.length; j++) {
      if (i === j) {
        matrix[i]![j] = {
          score: 1.0,
          quality: 'rich',
          distance: 0,
          method: 'exact',
        };
      } else {
        const rn1 = results[i]!.rhymeNucleus || results[i]!.ipa;
        const rn2 = results[j]!.rhymeNucleus || results[j]!.ipa;
        matrix[i]![j] = calculateRhymeSimilarity(rn1, rn2, true);
      }
    }
  }

  return matrix;
};

/**
 * Enhanced rhyme detection for songUtils integration
 * Returns whether two lines rhyme based on IPA similarity
 */
export const doLinesRhymeIPA = async (
  line1: string,
  line2: string,
  langCode: string,
  threshold = 0.75
): Promise<boolean> => {
  const similarity = await compareTextsWithIPA(line1, line2, langCode);
  return similarity.score >= threshold;
};

/**
 * Get rhyme quality classification for a pair of lines
 */
export const getRhymeQualityForLines = async (
  line1: string,
  line2: string,
  langCode: string
): Promise<RhymeSimilarityResult> => {
  return compareTextsWithIPA(line1, line2, langCode);
};

/**
 * IPA-based rhyme scheme detector (experimental)
 * Uses phonemic similarity instead of graphemic matching
 * @param lines - Array of line texts to analyze
 * @param langCode - Language code (required for IPA processing)
 * @param threshold - Similarity threshold (default 0.75)
 * @returns Promise<string | null> - The detected rhyme scheme
 */
export const detectRhymeSchemeLocallyIPA = async (
  lines: string[],
  langCode: string,
  threshold = 0.75
): Promise<string | null> => {
  const lyricLines = lines.filter(line => line.trim().length > 0);
  const n = lyricLines.length;
  if (n < 2) return null;

  const letters: (string | null)[] = new Array(n).fill(null);
  let nextLetter = 0;

  for (let i = 0; i < n; i++) {
    if (letters[i] !== null) continue;
    let matchedLetter: string | null = null;
    for (let j = 0; j < i; j++) {
      if (await doLinesRhymeIPA(lyricLines[i]!, lyricLines[j]!, langCode, threshold)) {
        matchedLetter = letters[j]!;
        break;
      }
    }
    if (matchedLetter) {
      letters[i] = matchedLetter;
    } else {
      letters[i] = RHYME_SCHEME_LETTERS[nextLetter] ?? String.fromCharCode(65 + nextLetter);
      nextLetter++;
    }
    for (let k = i + 1; k < n; k++) {
      if (letters[k] === null && await doLinesRhymeIPA(lyricLines[i]!, lyricLines[k]!, langCode, threshold)) {
        letters[k] = letters[i]!;
      }
    }
  }

  return finalizeDetectedRhymeScheme(letters);
};

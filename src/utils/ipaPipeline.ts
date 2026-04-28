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
 * Seuils de similarité IPA différenciés par famille phonologique.
 *
 * Familles tonales (KWA, SIN, VIET, TAI) : seuil relevé — les tons sont
 * discriminants, une légère variation de noyau vocalique ne constitue pas
 * une rime.
 *
 * Familles à coda haute pertinence (GER, SLV, KOR, VIET) : seuil légèrement
 * abaissé — la richesse consonantique de coda compense une correspondance
 * vocalique moins stricte.
 *
 * Toutes les familles non listées héritent du seuil par défaut (0.75).
 */
const FAMILY_RHYME_THRESHOLDS: Partial<Record<AlgoFamily, number>> = {
  'ALGO-KWA':  0.80,
  'ALGO-SIN':  0.82,
  'ALGO-VIET': 0.82,
  'ALGO-TAI':  0.80,
  'ALGO-BNT':  0.78,
  'ALGO-CRV':  0.78,
  'ALGO-GER':  0.72,
  'ALGO-SLV':  0.72,
  'ALGO-KOR':  0.72,
};

/**
 * Per-family tone weight ∈ [0.0, 1.0].
 *
 * Controls how much tonal mismatch penalises the rhyme score when
 * calculateRhymeSimilarity receives a toneWeight argument.
 *
 * 0.0  = tone is ignored (non-tonal families)
 * 0.5  = balanced (moderate tonal constraint, default for tonal families
 *         not listed here)
 * 0.55 = BNT/KWA/CRV: tone matters but vowel nucleus dominates
 * 0.65 = TAI: 5-tone system, tone is a strong discriminant
 * 0.70 = SIN/VIET: lexical tone = meaning; near-identical nuclei with
 *         different tones are NOT rhymes in formal poetry
 *
 * Consumers may override per-call via compareTextsWithIPA({ toneWeight }).
 */
export const TONE_WEIGHT_DEFAULTS: Partial<Record<AlgoFamily, number>> = {
  'ALGO-SIN':  0.70,
  'ALGO-VIET': 0.70,
  'ALGO-TAI':  0.65,
  'ALGO-KWA':  0.55,
  'ALGO-CRV':  0.55,
  'ALGO-BNT':  0.55,
};

/**
 * Resolve the effective tone weight for a given language code.
 * Non-tonal families always return 0.0.
 * @param langCode - ISO 639 code
 * @param override - Optional caller-supplied value that takes precedence
 */
export const getToneWeightForLangCode = (langCode: string, override?: number): number => {
  if (override !== undefined) return Math.max(0, Math.min(1, override));
  const family = getAlgoFamily(langCode);
  if (!family) return 0.0;
  return TONE_WEIGHT_DEFAULTS[family] ?? 0.0;
};

/**
 * Retourne le seuil IPA adapté à la famille phonologique du langCode.
 * @param langCode - Code ISO 639
 * @param base - Seuil par défaut si la famille n'est pas listée (default 0.75)
 */
export const getThresholdForLangCode = (langCode: string, base = 0.75): number => {
  const family = getAlgoFamily(langCode);
  return (family && FAMILY_RHYME_THRESHOLDS[family]) ?? base;
};

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

  const family = getAlgoFamily(langCode) || 'ALGO-ROM';
  const config = getFamilyConfig(langCode);

  let ipaText = '';
  let syllables: IPASyllable[] = [];
  let method: 'service' | 'client-fallback' | 'graphemic' = 'graphemic';
  let lowResource = true;

  try {
    const serviceResult = await phonemizeText(normalized, langCode, signal);
    if (serviceResult) {
      ipaText = serviceResult.ipa;
      method = 'service';
      lowResource = serviceResult.low_resource;

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
    console.debug('Phonemization service unavailable, using client fallback');
  }

  throwIfAborted(signal);

  if (!ipaText) {
    ipaText = graphemeToIPA(normalized, family);
    method = 'client-fallback';
    lowResource = true;
  }

  if (syllables.length === 0 && ipaText) {
    syllables = syllabifyIPA(ipaText, family);
  }

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
 * Options for compareTextsWithIPA.
 */
export interface CompareTextsOptions {
  /**
   * Override the tone weight for this comparison.
   * When absent, TONE_WEIGHT_DEFAULTS[family] is used.
   * 0.0 = ignore tones, 1.0 = tones are fully decisive.
   */
  toneWeight?: number;
}

/**
 * Compare two texts using the full IPA pipeline (step 5).
 *
 * toneWeight is resolved in priority order:
 *   1. options.toneWeight (caller override)
 *   2. TONE_WEIGHT_DEFAULTS[family] for the shared family
 *   3. 0.0 for non-tonal or unknown families
 *
 * Cross-family pairs (code-switching): each text is phonemized through its
 * own langCode pipeline, then scored with the lower of the two tone weights
 * (conservative: only penalise tone when *both* languages are tonal).
 *
 * @param text1    First line text
 * @param text2    Second line text
 * @param langCode Primary language code (both texts when no cross-family pair)
 * @param options  Optional overrides (toneWeight, langCode2 for code-switching)
 */
export const compareTextsWithIPA = async (
  text1: string,
  text2: string,
  langCode: string,
  options?: CompareTextsOptions & { langCode2?: string },
): Promise<RhymeSimilarityResult> => {
  const langCode2 = options?.langCode2 ?? langCode;

  const [result1, result2] = await Promise.all([
    runIPAPipeline(text1, langCode),
    runIPAPipeline(text2, langCode2),
  ]);

  if (!result1.success || !result2.success) {
    return {
      score: 0,
      quality: 'none',
      distance: Infinity,
      method: 'exact',
    };
  }

  const rn1 = result1.rhymeNucleus || result1.ipa;
  const rn2 = result2.rhymeNucleus || result2.ipa;

  // Resolve effective tone weight
  const tw1 = getToneWeightForLangCode(langCode, options?.toneWeight);
  const tw2 = getToneWeightForLangCode(langCode2, options?.toneWeight);
  // Cross-family: conservative minimum (only penalise when both are tonal)
  const effectiveToneWeight = tw1 > 0 && tw2 > 0 ? Math.min(tw1, tw2) : 0.0;

  // CRV weight-aware scoring path
  if (result1.family === 'ALGO-CRV' && result2.family === 'ALGO-CRV') {
    const weight1 = result1.syllables.length > 0
      ? result1.syllables[result1.syllables.length - 1]?.weight
      : undefined;
    const weight2 = result2.syllables.length > 0
      ? result2.syllables[result2.syllables.length - 1]?.weight
      : undefined;
    return calculateRhymeSimilarityWithWeight(rn1, rn2, weight1, weight2, true);
  }

  return calculateRhymeSimilarity(rn1, rn2, true, effectiveToneWeight > 0 ? effectiveToneWeight : undefined);
};

/**
 * Batch process multiple texts through the IPA pipeline
 */
export const runIPAPipelineBatch = async (
  texts: string[],
  langCode: string,
  signal?: AbortSignal,
): Promise<IPAPipelineResult[]> => {
  return Promise.all(texts.map(text => runIPAPipeline(text, langCode, signal)));
};

/**
 * Compare multiple texts for rhyme detection — returns pairwise similarity matrix
 */
export const compareMultipleTexts = async (
  texts: string[],
  langCode: string
): Promise<RhymeSimilarityResult[][]> => {
  const results = await runIPAPipelineBatch(texts, langCode);

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
 * Enhanced rhyme detection for songUtils integration.
 * Quand threshold n'est pas fourni, le seuil est dérivé automatiquement
 * de la famille phonologique du langCode via FAMILY_RHYME_THRESHOLDS.
 */
export const doLinesRhymeIPA = async (
  line1: string,
  line2: string,
  langCode: string,
  threshold?: number,
  options?: CompareTextsOptions & { langCode2?: string },
): Promise<boolean> => {
  const effectiveThreshold = threshold ?? getThresholdForLangCode(langCode);
  const similarity = await compareTextsWithIPA(line1, line2, langCode, options);
  return similarity.score >= effectiveThreshold;
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
 * IPA-based rhyme scheme detector (experimental).
 * Quand threshold n'est pas fourni, le seuil est dérivé automatiquement
 * de la famille phonologique du langCode via FAMILY_RHYME_THRESHOLDS.
 */
export const detectRhymeSchemeLocallyIPA = async (
  lines: string[],
  langCode: string,
  threshold?: number
): Promise<string | null> => {
  const effectiveThreshold = threshold ?? getThresholdForLangCode(langCode);
  const lyricLines = lines.filter(line => line.trim().length > 0);
  const n = lyricLines.length;
  if (n < 2) return null;

  const letters: (string | null)[] = new Array(n).fill(null);
  let nextLetter = 0;

  for (let i = 0; i < n; i++) {
    if (letters[i] !== null) continue;
    let matchedLetter: string | null = null;
    for (let j = 0; j < i; j++) {
      if (await doLinesRhymeIPA(lyricLines[i]!, lyricLines[j]!, langCode, effectiveThreshold)) {
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
      if (letters[k] === null && await doLinesRhymeIPA(lyricLines[i]!, lyricLines[k]!, langCode, effectiveThreshold)) {
        letters[k] = letters[i]!;
      }
    }
  }

  return finalizeDetectedRhymeScheme(letters);
};

import type { CheckerConfig } from './types';

/**
 * Default English stopwords. Deliberately conservative — we do NOT filter
 * out content words. The set is intentionally generic so it can be swapped
 * per language by host applications.
 */
const EN_STOPWORDS: ReadonlySet<string> = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he',
  'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these',
  'those', 'so', 'just', 'not', 'no', 'yes', 'oh', 'ah', 'yeah', 'na',
  'la', 'hey', 'ooh',
]);

const FR_STOPWORDS: ReadonlySet<string> = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais',
  'à', 'au', 'aux', 'en', 'dans', 'sur', 'pour', 'par', 'avec', 'sans',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'me',
  'te', 'se', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'ce', 'cet', 'cette', 'ces', 'que', 'qui', 'quoi', 'dont', 'où', 'pas',
  'ne', 'oh', 'ah', 'ouais',
]);

export const DEFAULT_STOPWORDS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['en', EN_STOPWORDS],
  ['fr', FR_STOPWORDS],
]);

/**
 * Default configuration. All thresholds are explicit and can be overridden
 * by the host application — there are no implicit "safe word counts".
 */
export const DEFAULT_CHECKER_CONFIG: CheckerConfig = {
  normalization: {
    stripDiacritics: true,
    stopwords: DEFAULT_STOPWORDS,
    minTokenLength: 1,
  },
  ngrams: {
    sizes: [3, 4, 5],
    minPhraseTokens: 4,
  },
  weights: {
    exactPhrase: 0.32,
    repeatedLine: 0.22,
    partialLine: 0.10,
    fuzzyLexical: 0.10,
    structuralHook: 0.18,
    semanticBlock: 0.08,
    distinctivenessBonus: 0.10,
    clusterBonus: 0.08,
    genericPenalty: 0.50,
  },
  thresholds: {
    low: 20,
    moderate: 45,
    high: 70,
    escalate: 85,
    distinctiveTokenIDF: 1.4,
    clusterMaxLineGap: 1,
    minClusterSize: 3,
    escalatePhraseTokens: 7,
    escalateRepeatedLineHits: 3,
  },
  privacy: {
    maxExcerptChars: 80,
    maxFlaggedMatches: 25,
  },
};

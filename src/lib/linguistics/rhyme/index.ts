/**
 * rhyme/ barrel export  v3
 * Phase 1 — lyricSegmenter + rhymeSchemeDetector + syllableCounter
 * Phase 2 — frNormalizer + suggestRhymes
 */

// Segmenter (v3 structured + legacy compat)
export type { LyricLine, LineEndingUnit } from './lyricSegmenter';
export {
  splitLyricIntoLines,
  splitIntoRhymingLines,
  extractLineTail,
  extractLineEndingUnit,
} from './lyricSegmenter';

// Scheme detector
export { detectRhymeScheme, canonicalizeScheme } from './rhymeSchemeDetector';

// Syllable counter
export { countSyllables, countSyllablesFromIPA, countSyllablesHeuristic } from './syllableCounter';

// French normaliser
export { normalizeFrenchForRhyme, normalizeFrenchLine } from './frNormalizer';

// Rhyme suggestions
export type { RhymeSuggestion, SuggestRhymesResult, SuggestRhymesOptions } from './suggestRhymes';
export { suggestRhymes, registerLexicon, getLexiconSize } from './suggestRhymes';

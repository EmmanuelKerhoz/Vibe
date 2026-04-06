/**
 * rhyme/ barrel export
 * Phase 1 — lyricSegmenter + rhymeSchemeDetector + syllableCounter
 */

export { splitIntoRhymingLines, extractLineTail } from './lyricSegmenter';
export { detectRhymeScheme, canonicalizeScheme } from './rhymeSchemeDetector';
export { countSyllables, countSyllablesFromIPA, countSyllablesHeuristic } from './syllableCounter';

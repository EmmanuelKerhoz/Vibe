/**
 * index.ts — Lyricist v4.1 rhyme module exports
 */
export { segmentVerse, type RhymingUnit, type SegmentMode } from './verse_segmenter';
export { detectScheme, type SchemeResult, type ScorerFn } from './rhyme_scheme_detector';
export { detectSpans, type LangSpan, type LidPredictor } from './lid_span_router';
export { stripBeforeRnExtraction, stripMorphology, type StripResult } from './morpho_strip';
export { scoreEmbedding, rnToEmbedding, type EmbeddingScore, type NeuralEncoder } from './phoneme_embedding';

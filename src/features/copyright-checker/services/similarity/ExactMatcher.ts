import type {
  CheckerConfig,
  LyricDocumentBase,
  ReferenceLyricDocument,
  SimilarityMatch,
  SubmittedLyricDocument,
} from '../../domain/types';
import { MatchType } from '../../domain/enums';
import { decodeNGram, lineNGrams, longestCommonContiguous } from '../../utils/ngrams';
import { fnv1a64Hex, redactExcerpt } from '../../utils/textHashes';
import { isGenericPhrase, type DistinctivenessIndex } from '../../utils/distinctiveness';

interface ExactMatcherDeps {
  readonly config: CheckerConfig;
  readonly distinctiveness: DistinctivenessIndex;
}

const phraseStrength = (length: number, escalateLength: number): number => {
  // Smoothly saturating curve — 1.0 at the escalation threshold, never above.
  if (length <= 0) return 0;
  return Math.min(1, length / Math.max(1, escalateLength));
};

const buildExcerpt = (
  doc: LyricDocumentBase,
  lineStart: number,
  tokenStart: number,
  tokenEnd: number,
  maxChars: number,
): string => {
  const line = doc.lines[lineStart] ?? '';
  if (line === '') return '';
  const tokens = doc.lineTokens[lineStart] ?? [];
  const slice = tokens.slice(tokenStart, tokenEnd).join(' ');
  return redactExcerpt(slice.length > 0 ? slice : line, maxChars);
};

/**
 * Matcher A — exact n-gram, longest contiguous phrase, repeated whole/partial
 * line overlap. Generates one {@link SimilarityMatch} per discovered overlap.
 */
export class ExactMatcher {
  constructor(private readonly deps: ExactMatcherDeps) {}

  match(
    submitted: SubmittedLyricDocument,
    reference: ReferenceLyricDocument,
  ): SimilarityMatch[] {
    const { config, distinctiveness } = this.deps;
    const out: SimilarityMatch[] = [];

    // 1. n-gram overlap (multi-size). We track which submitted n-grams hit
    //    a reference n-gram and emit one match per coordinate pair.
    for (const n of config.ngrams.sizes) {
      const refIndex = new Map<string, { lineIndex: number; tokenStart: number }[]>();
      for (const ng of lineNGrams(reference.lineTokens, n)) {
        const list = refIndex.get(ng.key);
        if (list) list.push({ lineIndex: ng.lineIndex, tokenStart: ng.tokenStart });
        else refIndex.set(ng.key, [{ lineIndex: ng.lineIndex, tokenStart: ng.tokenStart }]);
      }
      for (const ng of lineNGrams(submitted.lineTokens, n)) {
        const refHits = refIndex.get(ng.key);
        if (!refHits || refHits.length === 0) continue;
        const tokens = decodeNGram(ng.key);
        const generic = isGenericPhrase(
          distinctiveness,
          tokens,
          config.thresholds.distinctiveTokenIDF,
        );
        const repeatedRefLine = refHits.length >= 2;
        const refHit = refHits[0]!;
        out.push({
          id: `exact-${n}-${ng.lineIndex}-${ng.tokenStart}-${reference.id}`,
          type: repeatedRefLine ? MatchType.REPEATED_LINE : MatchType.EXACT_PHRASE,
          strength: phraseStrength(n, config.thresholds.escalatePhraseTokens),
          submittedExcerpt: buildExcerpt(
            submitted,
            ng.lineIndex,
            ng.tokenStart,
            ng.tokenStart + n,
            config.privacy.maxExcerptChars,
          ),
          spanHash: fnv1a64Hex(ng.key),
          submittedSpan: {
            lineStart: ng.lineIndex,
            lineEnd: ng.lineIndex,
            tokenStart: ng.tokenStart,
            tokenEnd: ng.tokenStart + n,
          },
          referenceSpan: {
            lineStart: refHit.lineIndex,
            lineEnd: refHit.lineIndex,
            tokenStart: refHit.tokenStart,
            tokenEnd: refHit.tokenStart + n,
          },
          referenceDocumentId: reference.id,
          referenceLabel: reference.title ?? reference.id,
          tokenLength: n,
          genericOnly: generic,
          inRepeatedLine: repeatedRefLine,
        });
      }
    }

    // 2. Longest contiguous phrase across the whole token streams. Useful
    //    for catching long verbatim lifts that span line boundaries.
    const lcs = longestCommonContiguous(submitted.tokens, reference.tokens);
    if (lcs.length >= config.ngrams.minPhraseTokens) {
      const phraseTokens = submitted.tokens.slice(lcs.aStart, lcs.aStart + lcs.length);
      const generic = isGenericPhrase(
        distinctiveness,
        phraseTokens,
        config.thresholds.distinctiveTokenIDF,
      );
      out.push({
        id: `lcs-${reference.id}-${lcs.aStart}`,
        type: MatchType.EXACT_PHRASE,
        strength: phraseStrength(lcs.length, config.thresholds.escalatePhraseTokens),
        submittedExcerpt: redactExcerpt(phraseTokens.join(' '), config.privacy.maxExcerptChars),
        spanHash: fnv1a64Hex(`lcs|${phraseTokens.join('\u0001')}`),
        submittedSpan: {
          lineStart: 0,
          lineEnd: 0,
          tokenStart: lcs.aStart,
          tokenEnd: lcs.aStart + lcs.length,
        },
        referenceSpan: {
          lineStart: 0,
          lineEnd: 0,
          tokenStart: lcs.bStart,
          tokenEnd: lcs.bStart + lcs.length,
        },
        referenceDocumentId: reference.id,
        referenceLabel: reference.title ?? reference.id,
        tokenLength: lcs.length,
        genericOnly: generic,
        inRepeatedLine: false,
      });
    }

    // 3. Whole-line exact / partial-line overlap.
    const refLineCounts = new Map<string, number>();
    for (const lt of reference.lineTokens) {
      const key = lt.join(' ');
      if (key === '') continue;
      refLineCounts.set(key, (refLineCounts.get(key) ?? 0) + 1);
    }
    for (let li = 0; li < submitted.lineTokens.length; li += 1) {
      const subTokens = submitted.lineTokens[li] ?? [];
      const key = subTokens.join(' ');
      if (key === '') continue;
      const count = refLineCounts.get(key);
      if (!count) continue;
      const generic = isGenericPhrase(
        distinctiveness,
        subTokens,
        config.thresholds.distinctiveTokenIDF,
      );
      out.push({
        id: `line-${li}-${reference.id}`,
        type: count >= 2 ? MatchType.REPEATED_LINE : MatchType.PARTIAL_LINE,
        strength: phraseStrength(subTokens.length, config.thresholds.escalatePhraseTokens),
        submittedExcerpt: buildExcerpt(submitted, li, 0, subTokens.length, config.privacy.maxExcerptChars),
        spanHash: fnv1a64Hex(`line|${key}`),
        submittedSpan: { lineStart: li, lineEnd: li, tokenStart: 0, tokenEnd: subTokens.length },
        referenceSpan: { lineStart: -1, lineEnd: -1, tokenStart: 0, tokenEnd: subTokens.length },
        referenceDocumentId: reference.id,
        referenceLabel: reference.title ?? reference.id,
        tokenLength: subTokens.length,
        genericOnly: generic,
        inRepeatedLine: count >= 2,
      });
    }

    return out;
  }
}

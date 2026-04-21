import type {
  CheckerConfig,
  ReferenceLyricDocument,
  SimilarityMatch,
  SubmittedLyricDocument,
} from '../../domain/types';
import { MatchType } from '../../domain/enums';
import { fnv1a64Hex, redactExcerpt } from '../../utils/textHashes';
import { tokenIdf, type DistinctivenessIndex } from '../../utils/distinctiveness';

interface FuzzyMatcherDeps {
  readonly config: CheckerConfig;
  readonly distinctiveness: DistinctivenessIndex;
}

/** Token-set Jaccard similarity. */
const jaccard = (a: ReadonlySet<string>, b: ReadonlySet<string>): number => {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of smaller) if (larger.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
};

/**
 * Levenshtein distance — bounded helper used only for short suspicious
 * spans (we do not run it on the whole document).
 */
export const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = new Uint16Array(b.length + 1);
  let cur = new Uint16Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(
        (cur[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length] ?? 0;
};

/** 1 - normalized edit distance, clamped to 0..1. */
export const editSimilarity = (a: string, b: string): number => {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
};

/**
 * Matcher B — fuzzy lexical overlap. Combines Jaccard on token sets and
 * IDF-weighted overlap on rare tokens. Edit-distance is reserved for
 * short lines because it is O(n*m).
 */
export class FuzzyMatcher {
  constructor(private readonly deps: FuzzyMatcherDeps) {}

  match(
    submitted: SubmittedLyricDocument,
    reference: ReferenceLyricDocument,
  ): SimilarityMatch[] {
    const { config, distinctiveness } = this.deps;
    const out: SimilarityMatch[] = [];

    const subSet = new Set(submitted.tokens);
    const refSet = new Set(reference.tokens);
    const j = jaccard(subSet, refSet);

    // Weighted overlap on rare (high-IDF) tokens.
    let rareWeight = 0;
    let rareTotal = 0;
    for (const tok of subSet) {
      const w = tokenIdf(distinctiveness, tok);
      rareTotal += w;
      if (refSet.has(tok)) rareWeight += w;
    }
    const rareOverlap = rareTotal === 0 ? 0 : rareWeight / rareTotal;

    if (j > 0 || rareOverlap > 0) {
      const strength = Math.max(0, Math.min(1, 0.4 * j + 0.6 * rareOverlap));
      out.push({
        id: `fuzzy-${reference.id}`,
        type: MatchType.FUZZY_LEXICAL,
        strength,
        submittedExcerpt: redactExcerpt(
          submitted.tokens.slice(0, 12).join(' '),
          config.privacy.maxExcerptChars,
        ),
        spanHash: fnv1a64Hex(`fuzzy|${reference.id}|${strength.toFixed(3)}`),
        submittedSpan: { lineStart: 0, lineEnd: submitted.lines.length - 1, tokenStart: 0, tokenEnd: submitted.tokens.length },
        referenceSpan: { lineStart: 0, lineEnd: reference.lines.length - 1, tokenStart: 0, tokenEnd: reference.tokens.length },
        referenceDocumentId: reference.id,
        referenceLabel: reference.title ?? reference.id,
        tokenLength: subSet.size,
        genericOnly: rareOverlap < 0.1,
        inRepeatedLine: false,
      });
    }

    // Edit-distance scan on short suspicious lines (length <= 10 tokens).
    for (let li = 0; li < submitted.lineTokens.length; li += 1) {
      const subTokens = submitted.lineTokens[li] ?? [];
      if (subTokens.length === 0 || subTokens.length > 10) continue;
      const subLine = subTokens.join(' ');
      for (let rj = 0; rj < reference.lineTokens.length; rj += 1) {
        const refTokens = reference.lineTokens[rj] ?? [];
        if (refTokens.length === 0 || refTokens.length > 10) continue;
        const refLine = refTokens.join(' ');
        if (subLine === refLine) continue; // exact handled by ExactMatcher
        const sim = editSimilarity(subLine, refLine);
        if (sim < 0.85) continue;
        out.push({
          id: `fuzzy-line-${li}-${rj}-${reference.id}`,
          type: MatchType.PARTIAL_LINE,
          strength: sim,
          submittedExcerpt: redactExcerpt(subLine, config.privacy.maxExcerptChars),
          spanHash: fnv1a64Hex(`fuzzyline|${subLine}`),
          submittedSpan: { lineStart: li, lineEnd: li, tokenStart: 0, tokenEnd: subTokens.length },
          referenceSpan: { lineStart: rj, lineEnd: rj, tokenStart: 0, tokenEnd: refTokens.length },
          referenceDocumentId: reference.id,
          referenceLabel: reference.title ?? reference.id,
          tokenLength: subTokens.length,
          genericOnly: false,
          inRepeatedLine: false,
        });
      }
    }

    return out;
  }
}

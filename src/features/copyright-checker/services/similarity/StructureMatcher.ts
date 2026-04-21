import type {
  CheckerConfig,
  ReferenceLyricDocument,
  SimilarityMatch,
  SubmittedLyricDocument,
} from '../../domain/types';
import { MatchType } from '../../domain/enums';
import { fnv1a64Hex, redactExcerpt } from '../../utils/textHashes';

interface StructureMatcherDeps {
  readonly config: CheckerConfig;
}

/**
 * Identify lines that repeat at least twice within a document — a strong
 * signal that the line functions as a chorus / hook / refrain.
 */
const findRepeatedLines = (
  lineTokens: readonly (readonly string[])[],
): Map<string, number[]> => {
  const map = new Map<string, number[]>();
  for (let i = 0; i < lineTokens.length; i += 1) {
    const key = (lineTokens[i] ?? []).join(' ');
    if (key === '') continue;
    const list = map.get(key);
    if (list) list.push(i);
    else map.set(key, [i]);
  }
  for (const [k, list] of map) if (list.length < 2) map.delete(k);
  return map;
};

/**
 * Matcher C — structural overlap. Flags lines that repeat in BOTH the
 * submission and the reference (chorus-shape similarity), and amplifies
 * matches that fall into high-salience repeated lines.
 */
export class StructureMatcher {
  constructor(private readonly deps: StructureMatcherDeps) {}

  match(
    submitted: SubmittedLyricDocument,
    reference: ReferenceLyricDocument,
  ): SimilarityMatch[] {
    const { config } = this.deps;
    const subRepeats = findRepeatedLines(submitted.lineTokens);
    const refRepeats = findRepeatedLines(reference.lineTokens);
    if (subRepeats.size === 0 || refRepeats.size === 0) return [];

    const out: SimilarityMatch[] = [];
    for (const [key, subLines] of subRepeats) {
      const refLines = refRepeats.get(key);
      if (!refLines) continue;
      const subLine = subLines[0] ?? 0;
      const refLine = refLines[0] ?? 0;
      const tokens = key.split(' ');
      const hits = Math.min(subLines.length, refLines.length);
      const strength = Math.min(1, hits / Math.max(1, config.thresholds.escalateRepeatedLineHits));
      out.push({
        id: `struct-${reference.id}-${subLine}`,
        type: MatchType.STRUCTURAL_HOOK,
        strength,
        submittedExcerpt: redactExcerpt(submitted.lines[subLine] ?? key, config.privacy.maxExcerptChars),
        spanHash: fnv1a64Hex(`hook|${key}`),
        submittedSpan: {
          lineStart: subLines[0] ?? 0,
          lineEnd: subLines[subLines.length - 1] ?? 0,
          tokenStart: 0,
          tokenEnd: tokens.length,
        },
        referenceSpan: {
          lineStart: refLines[0] ?? 0,
          lineEnd: refLines[refLines.length - 1] ?? 0,
          tokenStart: 0,
          tokenEnd: tokens.length,
        },
        referenceDocumentId: reference.id,
        referenceLabel: reference.title ?? reference.id,
        tokenLength: tokens.length,
        genericOnly: false,
        inRepeatedLine: true,
      });
    }
    return out;
  }
}

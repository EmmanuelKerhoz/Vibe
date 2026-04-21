import type {
  CheckerConfig,
  RiskAssessment,
  RiskAssessmentSummary,
  SimilarityExplanation,
  SimilarityMatch,
} from '../../domain/types';
import { MatchType, RiskLevel } from '../../domain/enums';

interface RiskScorerDeps {
  readonly config: CheckerConfig;
}

interface ScoreInput {
  readonly submissionId: string;
  readonly matches: readonly SimilarityMatch[];
}

const matchWeight = (
  type: MatchType,
  weights: CheckerConfig['weights'],
): number => {
  switch (type) {
    case MatchType.EXACT_PHRASE: return weights.exactPhrase;
    case MatchType.REPEATED_LINE: return weights.repeatedLine;
    case MatchType.PARTIAL_LINE: return weights.partialLine;
    case MatchType.FUZZY_LEXICAL: return weights.fuzzyLexical;
    case MatchType.STRUCTURAL_HOOK: return weights.structuralHook;
    case MatchType.SEMANTIC_BLOCK: return weights.semanticBlock;
    default: return 0;
  }
};

const findClusters = (
  matches: readonly SimilarityMatch[],
  maxGap: number,
): SimilarityMatch[][] => {
  const sorted = [...matches].sort((a, b) => a.submittedSpan.lineStart - b.submittedSpan.lineStart);
  const clusters: SimilarityMatch[][] = [];
  let current: SimilarityMatch[] = [];
  let lastLine = -Infinity;
  for (const m of sorted) {
    if (m.submittedSpan.lineStart - lastLine <= maxGap + 1) {
      current.push(m);
    } else {
      if (current.length > 0) clusters.push(current);
      current = [m];
    }
    lastLine = m.submittedSpan.lineEnd;
  }
  if (current.length > 0) clusters.push(current);
  return clusters;
};

/**
 * Pure scoring function. Combines per-match strengths with type weights,
 * then applies distinctiveness/cluster bonuses and a generic-only penalty.
 */
export class RiskScorer {
  constructor(private readonly deps: RiskScorerDeps) {}

  score(input: ScoreInput): RiskAssessment {
    const { config } = this.deps;
    const { weights, thresholds, privacy } = config;
    const matches = input.matches;

    const reasons: SimilarityExplanation[] = [];
    let raw = 0;
    let genericRaw = 0;
    let nonGenericRaw = 0;

    let longestPhrase = 0;
    let repeatedLineHits = 0;
    let semanticHits = 0;

    for (const m of matches) {
      const w = matchWeight(m.type, weights);
      const contribution = w * m.strength;
      raw += contribution;
      if (m.genericOnly) genericRaw += contribution;
      else nonGenericRaw += contribution;

      if (m.type === MatchType.EXACT_PHRASE && m.tokenLength > longestPhrase) {
        longestPhrase = m.tokenLength;
      }
      if (m.type === MatchType.REPEATED_LINE || (m.type === MatchType.STRUCTURAL_HOOK && m.inRepeatedLine)) {
        repeatedLineHits += 1;
      }
      if (m.type === MatchType.SEMANTIC_BLOCK) semanticHits += 1;
    }

    // Distinctiveness bonus: how much of the raw score came from rare phrases.
    const distinctiveShare = raw === 0 ? 0 : nonGenericRaw / raw;
    const distinctivenessBonus = weights.distinctivenessBonus * distinctiveShare;
    if (distinctivenessBonus > 0.01) {
      reasons.push({
        code: 'distinctiveness_bonus',
        message: 'Overlap is concentrated on distinctive (rare) phrases.',
        weight: distinctivenessBonus,
      });
    }

    // Cluster bonus: contiguous overlap on adjacent lines.
    const clusters = findClusters(matches, thresholds.clusterMaxLineGap);
    const largestCluster = clusters.reduce((m, c) => Math.max(m, c.length), 0);
    const clusterBonus = largestCluster >= thresholds.minClusterSize
      ? weights.clusterBonus * Math.min(1, largestCluster / (thresholds.minClusterSize * 2))
      : 0;
    if (clusterBonus > 0) {
      reasons.push({
        code: 'cluster_bonus',
        message: `Overlap is clustered across ${largestCluster} adjacent lines.`,
        weight: clusterBonus,
      });
    }

    // Generic penalty: discount when the bulk of evidence is generic.
    const genericShare = raw === 0 ? 0 : genericRaw / raw;
    const genericPenalty = weights.genericPenalty * genericShare;
    if (genericPenalty > 0.05) {
      reasons.push({
        code: 'generic_downweight',
        message: 'Most overlap comes from common phrases and was downweighted.',
        weight: -genericPenalty,
      });
    }

    // Per-type explanations.
    if (longestPhrase >= config.ngrams.minPhraseTokens) {
      reasons.push({
        code: 'long_exact_phrase',
        message: `A ${longestPhrase}-token verbatim phrase was found in a reference.`,
        weight: matchWeight(MatchType.EXACT_PHRASE, weights),
      });
    }
    if (repeatedLineHits > 0) {
      reasons.push({
        code: 'repeated_hook',
        message: `Repeated line/hook overlap detected in ${repeatedLineHits} place(s).`,
        weight: weights.repeatedLine,
      });
    }
    if (semanticHits > 0 && nonGenericRaw > 0) {
      reasons.push({
        code: 'semantic_with_lexical',
        message: 'Semantic resemblance is supported by lexical overlap.',
        weight: weights.semanticBlock,
      });
    } else if (semanticHits > 0) {
      reasons.push({
        code: 'semantic_only',
        message: 'Semantic resemblance without strong lexical evidence — kept as a soft signal.',
        weight: weights.semanticBlock * 0.4,
      });
    }

    // Squash to 0..1, scale to 0..100.
    const adjusted = Math.max(0, raw + distinctivenessBonus + clusterBonus - genericPenalty);
    const normalized = 1 - Math.exp(-adjusted * 1.6);
    let overallScore = Math.round(normalized * 100);

    // Hard escalation triggers — never silent.
    let level = this.classify(overallScore);
    if (
      longestPhrase >= thresholds.escalatePhraseTokens ||
      repeatedLineHits >= thresholds.escalateRepeatedLineHits
    ) {
      level = RiskLevel.ESCALATE;
      overallScore = Math.max(overallScore, thresholds.escalate);
      reasons.push({
        code: 'escalation_trigger',
        message: 'Hard escalation threshold crossed (long exact phrase or repeated hooks).',
        weight: 1,
      });
    }

    const flagged = [...matches]
      .sort((a, b) => matchWeight(b.type, weights) * b.strength - matchWeight(a.type, weights) * a.strength)
      .slice(0, privacy.maxFlaggedMatches);

    const reviewerNotesTemplate = this.buildReviewerNotes(level, longestPhrase, repeatedLineHits);

    return {
      submissionId: input.submissionId,
      overallScore,
      level,
      reasons,
      flaggedMatches: flagged,
      reviewerNotesTemplate,
      generatedAt: Date.now(),
    };
  }

  /** Public wrapper for unit tests (pure mapping from score → level). */
  classify(score: number): RiskLevel {
    const t = this.deps.config.thresholds;
    if (score >= t.escalate) return RiskLevel.ESCALATE;
    if (score >= t.high) return RiskLevel.HIGH;
    if (score >= t.moderate) return RiskLevel.MODERATE;
    if (score >= t.low) return RiskLevel.MODERATE; // anything above LOW threshold is at least MODERATE
    return RiskLevel.LOW;
  }

  private buildReviewerNotes(
    level: RiskLevel,
    longestPhrase: number,
    repeatedLineHits: number,
  ): string {
    const lines: string[] = [
      `Risk level: ${level}`,
      `Longest exact phrase: ${longestPhrase} tokens`,
      `Repeated-line/hook hits: ${repeatedLineHits}`,
      '',
      'Reviewer checklist:',
      '- Confirm whether matched phrases are commonplace expressions.',
      '- Inspect any clustered overlap across adjacent lines.',
      '- Decide whether to rewrite, request clearance, or escalate to legal.',
      '',
      'Note: this assessment is an internal risk signal only. It is not a',
      'legal opinion and does not confirm copyright clearance.',
    ];
    return lines.join('\n');
  }
}

/**
 * Build a privacy-safe persistence summary from a full assessment. Drops
 * full submission/reference text and keeps only spans, hashes and
 * truncated excerpts.
 */
export const toAssessmentSummary = (
  assessment: RiskAssessment,
): RiskAssessmentSummary => ({
  submissionId: assessment.submissionId,
  overallScore: assessment.overallScore,
  level: assessment.level,
  matchSummaries: assessment.flaggedMatches.map((m) => ({
    type: m.type,
    spanHash: m.spanHash,
    submittedSpan: m.submittedSpan,
    referenceSpan: m.referenceSpan,
    referenceDocumentId: m.referenceDocumentId,
    referenceLabel: m.referenceLabel,
    tokenLength: m.tokenLength,
    truncatedExcerpt: m.submittedExcerpt,
  })),
  reasonCodes: assessment.reasons.map((r) => r.code),
  generatedAt: assessment.generatedAt,
});

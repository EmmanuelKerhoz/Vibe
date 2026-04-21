import { describe, expect, it } from 'vitest';
import { DEFAULT_CHECKER_CONFIG } from '../domain/config';
import { MatchType, RiskLevel } from '../domain/enums';
import type { SimilarityMatch } from '../domain/types';
import { RiskScorer, toAssessmentSummary } from '../services/similarity/RiskScorer';

const baseMatch: SimilarityMatch = {
  id: 'm',
  type: MatchType.EXACT_PHRASE,
  strength: 0.5,
  submittedExcerpt: 'snippet',
  spanHash: 'hash',
  submittedSpan: { lineStart: 0, lineEnd: 0, tokenStart: 0, tokenEnd: 4 },
  referenceSpan: { lineStart: 0, lineEnd: 0, tokenStart: 0, tokenEnd: 4 },
  referenceDocumentId: 'ref-1',
  referenceLabel: 'Ref One',
  tokenLength: 4,
  genericOnly: false,
  inRepeatedLine: false,
};

const scorer = new RiskScorer({ config: DEFAULT_CHECKER_CONFIG });

describe('RiskScorer', () => {
  it('returns LOW with no matches', () => {
    const a = scorer.score({ submissionId: 's', matches: [] });
    expect(a.overallScore).toBe(0);
    expect(a.level).toBe(RiskLevel.LOW);
    expect(a.flaggedMatches).toHaveLength(0);
    expect(a.reviewerNotesTemplate).toContain('Risk level');
  });

  it('downweights generic-only overlap', () => {
    const generic = scorer.score({
      submissionId: 's', matches: [{ ...baseMatch, genericOnly: true }],
    });
    const distinctive = scorer.score({
      submissionId: 's', matches: [{ ...baseMatch, genericOnly: false }],
    });
    expect(generic.overallScore).toBeLessThan(distinctive.overallScore);
    expect(generic.reasons.map((r) => r.code)).toContain('generic_downweight');
  });

  it('escalates on a long exact phrase', () => {
    const longPhrase: SimilarityMatch = {
      ...baseMatch,
      tokenLength: DEFAULT_CHECKER_CONFIG.thresholds.escalatePhraseTokens + 1,
      strength: 1,
    };
    const a = scorer.score({ submissionId: 's', matches: [longPhrase] });
    expect(a.level).toBe(RiskLevel.ESCALATE);
    expect(a.reasons.map((r) => r.code)).toContain('escalation_trigger');
  });

  it('escalates on repeated hook hits', () => {
    const hooks: SimilarityMatch[] = Array.from(
      { length: DEFAULT_CHECKER_CONFIG.thresholds.escalateRepeatedLineHits },
      (_, i): SimilarityMatch => ({
        ...baseMatch,
        id: `hook-${i}`,
        type: MatchType.REPEATED_LINE,
        strength: 0.7,
        inRepeatedLine: true,
        submittedSpan: { ...baseMatch.submittedSpan, lineStart: i * 4, lineEnd: i * 4 },
      }),
    );
    const a = scorer.score({ submissionId: 's', matches: hooks });
    expect(a.level).toBe(RiskLevel.ESCALATE);
  });

  it('adds a cluster bonus when matches concentrate on adjacent lines', () => {
    const cluster: SimilarityMatch[] = [0, 1, 2].map((i): SimilarityMatch => ({
      ...baseMatch,
      id: `c-${i}`,
      submittedSpan: { lineStart: i, lineEnd: i, tokenStart: 0, tokenEnd: 4 },
    }));
    const spread: SimilarityMatch[] = [0, 20, 40].map((i): SimilarityMatch => ({
      ...baseMatch,
      id: `s-${i}`,
      submittedSpan: { lineStart: i, lineEnd: i, tokenStart: 0, tokenEnd: 4 },
    }));
    const aCluster = scorer.score({ submissionId: 's', matches: cluster });
    const aSpread = scorer.score({ submissionId: 's', matches: spread });
    expect(aCluster.reasons.map((r) => r.code)).toContain('cluster_bonus');
    expect(aCluster.overallScore).toBeGreaterThan(aSpread.overallScore);
  });

  it('classify maps thresholds to levels', () => {
    const t = DEFAULT_CHECKER_CONFIG.thresholds;
    expect(scorer.classify(0)).toBe(RiskLevel.LOW);
    expect(scorer.classify(t.moderate)).toBe(RiskLevel.MODERATE);
    expect(scorer.classify(t.high)).toBe(RiskLevel.HIGH);
    expect(scorer.classify(t.escalate)).toBe(RiskLevel.ESCALATE);
  });

  it('toAssessmentSummary strips full text and keeps coordinates', () => {
    const a = scorer.score({ submissionId: 's', matches: [baseMatch] });
    const summary = toAssessmentSummary(a);
    expect(summary.matchSummaries[0]?.spanHash).toBe('hash');
    expect(summary.matchSummaries[0]?.truncatedExcerpt.length).toBeLessThanOrEqual(
      DEFAULT_CHECKER_CONFIG.privacy.maxExcerptChars,
    );
    expect((summary as unknown as Record<string, unknown>).flaggedMatches).toBeUndefined();
  });
});

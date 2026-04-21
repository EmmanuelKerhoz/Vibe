import { SourceType } from './enums';
import type { MatchType, ReviewOutcome, RiskLevel } from './enums';

/** ISO 639-1 language hint (lowercase, e.g. "en", "fr"). */
export type LanguageCode = string;

/** Generic key/value metadata with primitive values only. */
export type DocumentMetadata = Readonly<Record<string, string | number | boolean | undefined>>;

/** A line-aligned chunk used by the semantic provider. */
export interface SemanticChunk {
  readonly chunkId: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly text: string;
}

/** Common shape of any lyric document the engine can reason about. */
export interface LyricDocumentBase {
  readonly id: string;
  readonly sourceType: SourceType;
  readonly title?: string;
  readonly artist?: string;
  readonly language?: LanguageCode;
  readonly normalizedText: string;
  readonly tokens: readonly string[];
  readonly lines: readonly string[];
  readonly lineTokens: readonly (readonly string[])[];
  readonly chunks?: readonly SemanticChunk[];
  readonly metadata?: DocumentMetadata;
}

/** A document submitted by the user for risk assessment. */
export interface SubmittedLyricDocument extends LyricDocumentBase {
  readonly sourceType: typeof SourceType.USER_SUBMITTED;
}

/**
 * A reference document compared against the submission.
 *
 * The full {@link LyricDocumentBase.normalizedText} of an external reference
 * MUST NOT be persisted in client storage — see {@link RiskAssessmentSummary}.
 */
export interface ReferenceLyricDocument extends LyricDocumentBase {
  readonly sourceType: Exclude<SourceType, typeof SourceType.USER_SUBMITTED>;
}

/** A 0..1 similarity score on a single signal. */
export type Score01 = number;

/** Coordinates of an overlap inside a document (line and token indexes). */
export interface MatchSpan {
  readonly lineStart: number;
  readonly lineEnd: number;
  /** Token index within the first matched line. */
  readonly tokenStart: number;
  /** Token index (exclusive) within the last matched line. */
  readonly tokenEnd: number;
}

/** A single similarity finding produced by one of the matchers. */
export interface SimilarityMatch {
  readonly id: string;
  readonly type: MatchType;
  /** 0..1 contribution of this match to the overall score, before weighting. */
  readonly strength: Score01;
  /** Truncated, internal-only excerpt from the submission (never the reference). */
  readonly submittedExcerpt: string;
  /** SHA-256 hex of the normalized matched span (privacy-preserving fingerprint). */
  readonly spanHash: string;
  readonly submittedSpan: MatchSpan;
  readonly referenceSpan: MatchSpan;
  readonly referenceDocumentId: string;
  /** Reference identifier-only display title (no lyric content). */
  readonly referenceLabel: string;
  /** Token length of the overlap (informational; not a legal threshold). */
  readonly tokenLength: number;
  /** True if the overlap is composed only of generic / stop-phrase tokens. */
  readonly genericOnly: boolean;
  /** True if the overlap occurs in a repeated structural line (chorus/hook). */
  readonly inRepeatedLine: boolean;
}

/** Human-readable explanation attached to an assessment. */
export interface SimilarityExplanation {
  readonly code: string;
  readonly message: string;
  /** Indicative weight (0..1) this reason carried in the final score. */
  readonly weight: Score01;
}

/** Final risk assessment returned by the engine. */
export interface RiskAssessment {
  readonly submissionId: string;
  /** Overall score on 0..100. Indicative only, never a legal verdict. */
  readonly overallScore: number;
  readonly level: RiskLevel;
  readonly reasons: readonly SimilarityExplanation[];
  readonly flaggedMatches: readonly SimilarityMatch[];
  readonly reviewerNotesTemplate: string;
  readonly generatedAt: number;
}

/**
 * Persistence-friendly summary. By design contains NO full reference lyrics,
 * NO full submission text — only hashes, coordinates and truncated excerpts.
 */
export interface RiskAssessmentSummary {
  readonly submissionId: string;
  readonly overallScore: number;
  readonly level: RiskLevel;
  readonly matchSummaries: readonly {
    readonly type: MatchType;
    readonly spanHash: string;
    readonly submittedSpan: MatchSpan;
    readonly referenceSpan: MatchSpan;
    readonly referenceDocumentId: string;
    readonly referenceLabel: string;
    readonly tokenLength: number;
    readonly truncatedExcerpt: string;
  }[];
  readonly reasonCodes: readonly string[];
  readonly generatedAt: number;
}

/** Reviewer decision — captured externally and stored alongside the assessment. */
export interface ReviewDecision {
  readonly submissionId: string;
  readonly outcome: ReviewOutcome;
  readonly reviewerId: string;
  readonly notes: string;
  readonly decidedAt: number;
}

/** Tunable thresholds and weights — no magic numbers in the matchers. */
export interface CheckerConfig {
  readonly normalization: {
    readonly stripDiacritics: boolean;
    readonly stopwords: ReadonlyMap<LanguageCode, ReadonlySet<string>>;
    readonly minTokenLength: number;
  };
  readonly ngrams: {
    readonly sizes: readonly number[];
    readonly minPhraseTokens: number;
  };
  readonly weights: {
    readonly exactPhrase: number;
    readonly repeatedLine: number;
    readonly partialLine: number;
    readonly fuzzyLexical: number;
    readonly structuralHook: number;
    readonly semanticBlock: number;
    readonly distinctivenessBonus: number;
    readonly clusterBonus: number;
    readonly genericPenalty: number;
  };
  readonly thresholds: {
    readonly low: number;
    readonly moderate: number;
    readonly high: number;
    readonly escalate: number;
    readonly distinctiveTokenIDF: number;
    readonly clusterMaxLineGap: number;
    readonly minClusterSize: number;
    readonly escalatePhraseTokens: number;
    readonly escalateRepeatedLineHits: number;
  };
  readonly privacy: {
    readonly maxExcerptChars: number;
    readonly maxFlaggedMatches: number;
  };
}

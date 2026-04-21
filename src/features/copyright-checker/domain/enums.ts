/**
 * Risk classification for a similarity assessment.
 *
 * The checker is an internal risk signal — it is intentionally NOT a legal
 * verdict. Labels are deliberately neutral; we never expose terms like
 * "safe", "cleared" or "non-infringing".
 */
export const RiskLevel = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  ESCALATE: 'ESCALATE',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

/** Origin of a candidate document (informational only — never trusted as license). */
export const SourceType = {
  USER_SUBMITTED: 'USER_SUBMITTED',
  INTERNAL_LIBRARY: 'INTERNAL_LIBRARY',
  LICENSED_REFERENCE: 'LICENSED_REFERENCE',
  PUBLIC_DOMAIN: 'PUBLIC_DOMAIN',
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];

/** Match producer (which similarity layer flagged the overlap). */
export const MatchType = {
  EXACT_PHRASE: 'EXACT_PHRASE',
  REPEATED_LINE: 'REPEATED_LINE',
  PARTIAL_LINE: 'PARTIAL_LINE',
  FUZZY_LEXICAL: 'FUZZY_LEXICAL',
  STRUCTURAL_HOOK: 'STRUCTURAL_HOOK',
  SEMANTIC_BLOCK: 'SEMANTIC_BLOCK',
} as const;
export type MatchType = (typeof MatchType)[keyof typeof MatchType];

/** Outcome of a human review. Stored alongside the assessment, never auto-set. */
export const ReviewOutcome = {
  PENDING: 'PENDING',
  CLEARED_BY_REVIEWER: 'CLEARED_BY_REVIEWER',
  REWRITE_REQUESTED: 'REWRITE_REQUESTED',
  ESCALATED_TO_LEGAL: 'ESCALATED_TO_LEGAL',
} as const;
export type ReviewOutcome = (typeof ReviewOutcome)[keyof typeof ReviewOutcome];

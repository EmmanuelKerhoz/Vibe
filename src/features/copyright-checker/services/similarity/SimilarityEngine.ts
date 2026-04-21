import type {
  CheckerConfig,
  ReferenceLyricDocument,
  RiskAssessment,
  SimilarityMatch,
  SubmittedLyricDocument,
} from '../../domain/types';
import { DEFAULT_CHECKER_CONFIG } from '../../domain/config';
import {
  buildDistinctivenessIndex,
  type DistinctivenessIndex,
} from '../../utils/distinctiveness';
import { sha256Hex } from '../../utils/textHashes';
import type { ReferenceCorpusRepository } from '../repository/ReferenceCorpusRepository';
import { ExactMatcher } from './ExactMatcher';
import { FuzzyMatcher } from './FuzzyMatcher';
import { StructureMatcher } from './StructureMatcher';
import { SemanticMatcher, type EmbeddingProvider } from './SemanticMatcher';
import { RiskScorer, toAssessmentSummary } from './RiskScorer';

/** Optional offload point for heavy work (web worker etc.). */
export interface SimilarityOffload {
  run<T>(name: string, fn: () => Promise<T>): Promise<T>;
}

/** Default offload: synchronous execution on the main thread. */
export const inlineOffload: SimilarityOffload = {
  run: <T>(_name: string, fn: () => Promise<T>) => fn(),
};

export interface SimilarityEngineDeps {
  readonly repository: ReferenceCorpusRepository;
  readonly config?: CheckerConfig;
  readonly embeddings?: EmbeddingProvider;
  readonly offload?: SimilarityOffload;
}

const buildCorpusDistinctiveness = (
  references: readonly ReferenceLyricDocument[],
): DistinctivenessIndex => {
  const df = new Map<string, number>();
  for (const ref of references) {
    const seen = new Set<string>();
    for (const t of ref.tokens) seen.add(t);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return buildDistinctivenessIndex({
    documentFrequency: df,
    totalDocuments: references.length,
  });
};

/**
 * Orchestrates candidate pruning + matcher fan-out + scoring. Returns a
 * single {@link RiskAssessment} for the submission. Pure aside from the
 * repository call and the embedding provider.
 */
export class SimilarityEngine {
  private readonly config: CheckerConfig;
  constructor(private readonly deps: SimilarityEngineDeps) {
    this.config = deps.config ?? DEFAULT_CHECKER_CONFIG;
  }

  async assess(submitted: SubmittedLyricDocument): Promise<RiskAssessment> {
    const offload = this.deps.offload ?? inlineOffload;
    const candidates = await this.deps.repository.searchCandidateReferences({
      tokens: submitted.tokens,
      ...(submitted.language ? { language: submitted.language } : {}),
      maxResults: 25,
    });

    if (candidates.length === 0) {
      const scorer = new RiskScorer({ config: this.config });
      return scorer.score({ submissionId: submitted.id, matches: [] });
    }

    const distinctiveness = buildCorpusDistinctiveness(candidates);
    const exact = new ExactMatcher({ config: this.config, distinctiveness });
    const fuzzy = new FuzzyMatcher({ config: this.config, distinctiveness });
    const structure = new StructureMatcher({ config: this.config });
    const semantic = this.deps.embeddings
      ? new SemanticMatcher({ config: this.config, provider: this.deps.embeddings })
      : null;

    const allMatches: SimilarityMatch[] = [];
    for (const ref of candidates) {
      const collected = await offload.run(`assess:${ref.id}`, async () => {
        const ms: SimilarityMatch[] = [];
        ms.push(...exact.match(submitted, ref));
        ms.push(...fuzzy.match(submitted, ref));
        ms.push(...structure.match(submitted, ref));
        if (semantic) ms.push(...(await semantic.match(submitted, ref)));
        return ms;
      });
      allMatches.push(...collected);
    }

    // Replace fast FNV hashes with SHA-256 (privacy-preferred algorithm).
    const hashedMatches = await Promise.all(
      allMatches.map(async (m) => ({ ...m, spanHash: await sha256Hex(m.spanHash) })),
    );

    const scorer = new RiskScorer({ config: this.config });
    return scorer.score({ submissionId: submitted.id, matches: hashedMatches });
  }
}

export { toAssessmentSummary };

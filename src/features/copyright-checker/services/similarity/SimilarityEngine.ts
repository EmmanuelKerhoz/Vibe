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

/**
 * Common shape implemented by every similarity matcher. The return value
 * may be synchronous (most lexical matchers) or asynchronous (semantic
 * matcher relying on an async embedding provider).
 */
export interface SimilarityMatcher {
  match(
    submitted: SubmittedLyricDocument,
    reference: ReferenceLyricDocument,
  ): SimilarityMatch[] | Promise<SimilarityMatch[]>;
}

/** Context passed to a matchers factory when building per-assessment matchers. */
export interface SimilarityMatchersContext {
  readonly config: CheckerConfig;
  readonly distinctiveness: DistinctivenessIndex;
  readonly embeddings?: EmbeddingProvider;
}

/**
 * Factory that builds the list of matchers used by {@link SimilarityEngine}
 * for a single assessment. Allows callers to inject custom matchers (or
 * stubbed/mocked ones in tests) without subclassing the engine.
 */
export type SimilarityMatchersFactory = (
  context: SimilarityMatchersContext,
) => readonly SimilarityMatcher[];

/**
 * Yield to the event loop so long similarity runs do not monopolise the
 * main thread. Uses a macrotask (setTimeout(0)) when available — falling
 * back to a microtask in environments without a timer.
 */
const yieldToEventLoop = (): Promise<void> =>
  new Promise<void>((resolve) => {
    if (typeof setTimeout === 'function') {
      setTimeout(resolve, 0);
      return;
    }
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve);
      return;
    }
    Promise.resolve().then(resolve);
  });

/**
 * Default offload: runs each task on the main thread but yields to the
 * event loop first so the UI stays responsive between candidates. Callers
 * that need true parallelism can provide a worker-backed implementation.
 */
export const inlineOffload: SimilarityOffload = {
  run: async <T>(_name: string, fn: () => Promise<T>): Promise<T> => {
    await yieldToEventLoop();
    return fn();
  },
};

/** Default factory: builds the built-in Exact/Fuzzy/Structure/Semantic matchers. */
export const defaultMatchersFactory: SimilarityMatchersFactory = ({
  config,
  distinctiveness,
  embeddings,
}) => {
  const matchers: SimilarityMatcher[] = [
    new ExactMatcher({ config, distinctiveness }),
    new FuzzyMatcher({ config, distinctiveness }),
    new StructureMatcher({ config }),
  ];
  if (embeddings) {
    matchers.push(new SemanticMatcher({ config, provider: embeddings }));
  }
  return matchers;
};

export interface SimilarityEngineDeps {
  readonly repository: ReferenceCorpusRepository;
  readonly config?: CheckerConfig;
  readonly embeddings?: EmbeddingProvider;
  readonly offload?: SimilarityOffload;
  /**
   * Optional override for the matchers used during an assessment. Defaults
   * to {@link defaultMatchersFactory}, which builds the standard
   * Exact/Fuzzy/Structure/Semantic stack.
   */
  readonly matchersFactory?: SimilarityMatchersFactory;
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
  private readonly matchersFactory: SimilarityMatchersFactory;
  constructor(private readonly deps: SimilarityEngineDeps) {
    this.config = deps.config ?? DEFAULT_CHECKER_CONFIG;
    this.matchersFactory = deps.matchersFactory ?? defaultMatchersFactory;
  }

  async assess(
    submitted: SubmittedLyricDocument,
    options?: { readonly signal?: AbortSignal },
  ): Promise<RiskAssessment> {
    const signal = options?.signal;
    const throwIfAborted = (): void => {
      if (signal?.aborted) {
        throw signal.reason ?? new DOMException('Aborted', 'AbortError');
      }
    };
    const offload = this.deps.offload ?? inlineOffload;
    throwIfAborted();
    const candidates = await this.deps.repository.searchCandidateReferences({
      tokens: submitted.tokens,
      ...(submitted.language ? { language: submitted.language } : {}),
      maxResults: 25,
      ...(signal ? { signal } : {}),
    });
    throwIfAborted();

    if (candidates.length === 0) {
      const scorer = new RiskScorer({ config: this.config });
      return scorer.score({ submissionId: submitted.id, matches: [] });
    }

    const distinctiveness = buildCorpusDistinctiveness(candidates);
    const matchers = this.matchersFactory({
      config: this.config,
      distinctiveness,
      ...(this.deps.embeddings ? { embeddings: this.deps.embeddings } : {}),
    });

    const allMatches: SimilarityMatch[] = [];
    for (const ref of candidates) {
      throwIfAborted();
      const collected = await offload.run(`assess:${ref.id}`, async () => {
        const ms: SimilarityMatch[] = [];
        for (const matcher of matchers) {
          throwIfAborted();
          const result = await matcher.match(submitted, ref);
          ms.push(...result);
        }
        return ms;
      });
      allMatches.push(...collected);
    }

    throwIfAborted();
    // Replace fast FNV hashes with SHA-256 (privacy-preferred algorithm).
    const hashedMatches = await Promise.all(
      allMatches.map(async (m) => ({ ...m, spanHash: await sha256Hex(m.spanHash) })),
    );

    const scorer = new RiskScorer({ config: this.config });
    return scorer.score({ submissionId: submitted.id, matches: hashedMatches });
  }
}

export { toAssessmentSummary };

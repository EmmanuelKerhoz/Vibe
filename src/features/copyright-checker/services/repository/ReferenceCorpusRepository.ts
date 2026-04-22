import type {
  LanguageCode,
  ReferenceLyricDocument,
  SemanticChunk,
} from '../../domain/types';
import { documentNGramSet } from '../../utils/ngrams';
import { DEFAULT_CHECKER_CONFIG } from '../../domain/config';

export interface CandidateSearchInput {
  readonly tokens: readonly string[];
  readonly language?: LanguageCode;
  readonly maxResults: number;
  /**
   * Optional cancellation signal. Implementations that perform network
   * I/O SHOULD honour it (e.g. forward to `fetch`) and reject with the
   * signal's reason as soon as it aborts. The in-memory implementation
   * checks it cooperatively.
   */
  readonly signal?: AbortSignal;
}

/** Compact pre-computed signature for fast candidate pruning. */
export interface ReferenceFingerprint {
  readonly id: string;
  readonly nGramSet: ReadonlySet<string>;
  readonly tokenSize: number;
}

/**
 * Source-agnostic interface for the reference corpus. Implementations may
 * back this with a local dataset, a licensed remote API or an in-memory
 * mock for tests.
 */
export interface ReferenceCorpusRepository {
  searchCandidateReferences(input: CandidateSearchInput): Promise<readonly ReferenceLyricDocument[]>;
  getReferenceFingerprint(id: string, options?: { readonly signal?: AbortSignal }): Promise<ReferenceFingerprint | null>;
  getReferenceSegments(id: string, options?: { readonly signal?: AbortSignal }): Promise<readonly SemanticChunk[]>;
}

/**
 * Offline mock repository — used by tests and dev. Fingerprints all
 * supplied references at construction time and shortlists by Jaccard on
 * the n-gram signature (first-pass screening).
 */
export class InMemoryReferenceRepository implements ReferenceCorpusRepository {
  private readonly references: ReadonlyMap<string, ReferenceLyricDocument>;
  private readonly fingerprints: ReadonlyMap<string, ReferenceFingerprint>;

  constructor(refs: readonly ReferenceLyricDocument[]) {
    const map = new Map<string, ReferenceLyricDocument>();
    const fps = new Map<string, ReferenceFingerprint>();
    const sizes = DEFAULT_CHECKER_CONFIG.ngrams.sizes;
    for (const r of refs) {
      map.set(r.id, r);
      fps.set(r.id, {
        id: r.id,
        nGramSet: documentNGramSet(r.tokens, sizes),
        tokenSize: r.tokens.length,
      });
    }
    this.references = map;
    this.fingerprints = fps;
  }

  async searchCandidateReferences(input: CandidateSearchInput): Promise<readonly ReferenceLyricDocument[]> {
    input.signal?.throwIfAborted?.();
    const sizes = DEFAULT_CHECKER_CONFIG.ngrams.sizes;
    const submittedSet = documentNGramSet(input.tokens, sizes);
    if (submittedSet.size === 0) return [];

    type Scored = { readonly ref: ReferenceLyricDocument; readonly score: number };
    const scored: Scored[] = [];
    for (const [id, fp] of this.fingerprints) {
      if (input.signal?.aborted) {
        throw input.signal.reason ?? new DOMException('Aborted', 'AbortError');
      }
      if (input.language) {
        const ref = this.references.get(id);
        if (ref?.language && ref.language !== input.language) continue;
      }
      let inter = 0;
      const [smaller, larger] = submittedSet.size <= fp.nGramSet.size
        ? [submittedSet, fp.nGramSet]
        : [fp.nGramSet, submittedSet];
      for (const k of smaller) if (larger.has(k)) inter += 1;
      if (inter === 0) continue;
      const union = submittedSet.size + fp.nGramSet.size - inter;
      const score = union === 0 ? 0 : inter / union;
      const ref = this.references.get(id);
      if (ref) scored.push({ ref, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, input.maxResults).map((s) => s.ref);
  }

  async getReferenceFingerprint(id: string, options?: { readonly signal?: AbortSignal }): Promise<ReferenceFingerprint | null> {
    options?.signal?.throwIfAborted?.();
    return this.fingerprints.get(id) ?? null;
  }

  async getReferenceSegments(id: string, options?: { readonly signal?: AbortSignal }): Promise<readonly SemanticChunk[]> {
    options?.signal?.throwIfAborted?.();
    return this.references.get(id)?.chunks ?? [];
  }
}

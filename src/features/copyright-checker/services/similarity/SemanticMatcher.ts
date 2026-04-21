import type {
  CheckerConfig,
  ReferenceLyricDocument,
  SemanticChunk,
  SimilarityMatch,
  SubmittedLyricDocument,
} from '../../domain/types';
import { MatchType } from '../../domain/enums';
import { fnv1a64Hex, redactExcerpt } from '../../utils/textHashes';

/**
 * Pluggable embedding provider. Implementations may call out to a local
 * model, a worker, or a hosted API. The default {@link HashingEmbeddingProvider}
 * is a deterministic stub suitable for tests and offline use — it is NOT
 * a substitute for a real embedding model.
 */
export interface EmbeddingProvider {
  /** Returns one embedding vector per input chunk; vectors are unit-length. */
  embed(chunks: readonly SemanticChunk[]): Promise<readonly Float32Array[]>;
}

const HASH_DIM = 64;

/**
 * Deterministic hashing-based embedding. Produces a unit vector from a
 * bag-of-words hash kernel. Good enough for local testing and as a safe
 * default; production deployments should inject a real model.
 */
export class HashingEmbeddingProvider implements EmbeddingProvider {
  async embed(chunks: readonly SemanticChunk[]): Promise<readonly Float32Array[]> {
    return chunks.map((c) => this.embedOne(c.text));
  }

  private embedOne(text: string): Float32Array {
    const v = new Float32Array(HASH_DIM);
    for (const tok of text.toLowerCase().split(/\s+/)) {
      if (!tok) continue;
      let h = 2166136261;
      for (let i = 0; i < tok.length; i += 1) {
        h = (h ^ tok.charCodeAt(i)) >>> 0;
        h = Math.imul(h, 16777619) >>> 0;
      }
      const idx = h % HASH_DIM;
      v[idx] = (v[idx] ?? 0) + 1;
    }
    let norm = 0;
    for (let i = 0; i < v.length; i += 1) norm += (v[i] ?? 0) * (v[i] ?? 0);
    norm = Math.sqrt(norm);
    if (norm > 0) for (let i = 0; i < v.length; i += 1) v[i] = (v[i] ?? 0) / norm;
    return v;
  }
}

const cosine = (a: Float32Array, b: Float32Array): number => {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += (a[i] ?? 0) * (b[i] ?? 0);
  return Math.max(-1, Math.min(1, dot));
};

interface SemanticMatcherDeps {
  readonly config: CheckerConfig;
  readonly provider: EmbeddingProvider;
  readonly minSimilarity?: number;
  readonly topK?: number;
}

/**
 * Matcher D — semantic similarity over line-grouped chunks. Returns only
 * the top-K most suspicious chunk pairs to avoid leaking dense match maps.
 */
export class SemanticMatcher {
  constructor(private readonly deps: SemanticMatcherDeps) {}

  async match(
    submitted: SubmittedLyricDocument,
    reference: ReferenceLyricDocument,
  ): Promise<SimilarityMatch[]> {
    const { config, provider } = this.deps;
    const minSim = this.deps.minSimilarity ?? 0.78;
    const topK = this.deps.topK ?? 3;

    const subChunks = submitted.chunks ?? [];
    const refChunks = reference.chunks ?? [];
    if (subChunks.length === 0 || refChunks.length === 0) return [];

    const [subEmb, refEmb] = await Promise.all([
      provider.embed(subChunks),
      provider.embed(refChunks),
    ]);

    type Pair = {
      readonly subIdx: number;
      readonly refIdx: number;
      readonly sim: number;
    };
    const pairs: Pair[] = [];
    for (let i = 0; i < subChunks.length; i += 1) {
      for (let j = 0; j < refChunks.length; j += 1) {
        const sim = cosine(subEmb[i] ?? new Float32Array(0), refEmb[j] ?? new Float32Array(0));
        if (sim >= minSim) pairs.push({ subIdx: i, refIdx: j, sim });
      }
    }
    pairs.sort((a, b) => b.sim - a.sim);

    const out: SimilarityMatch[] = [];
    for (const p of pairs.slice(0, topK)) {
      const sc = subChunks[p.subIdx]!;
      const rc = refChunks[p.refIdx]!;
      out.push({
        id: `sem-${reference.id}-${p.subIdx}-${p.refIdx}`,
        type: MatchType.SEMANTIC_BLOCK,
        strength: p.sim,
        submittedExcerpt: redactExcerpt(sc.text, config.privacy.maxExcerptChars),
        spanHash: fnv1a64Hex(`sem|${sc.chunkId}|${rc.chunkId}|${p.sim.toFixed(3)}`),
        submittedSpan: { lineStart: sc.startLine, lineEnd: sc.endLine, tokenStart: 0, tokenEnd: 0 },
        referenceSpan: { lineStart: rc.startLine, lineEnd: rc.endLine, tokenStart: 0, tokenEnd: 0 },
        referenceDocumentId: reference.id,
        referenceLabel: reference.title ?? reference.id,
        tokenLength: 0,
        genericOnly: false,
        inRepeatedLine: false,
      });
    }
    return out;
  }
}

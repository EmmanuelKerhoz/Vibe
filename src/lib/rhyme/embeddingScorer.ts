/**
 * embeddingScorer.ts
 * Step 5 — Level-4 embedding-based phonetic similarity scoring.
 *
 * Two backends:
 *   A. CharsiuG2P cosine similarity — for SIN/JAP/KOR where G2P output
 *      maps directly to embedding space. (Runtime: calls external G2P service.)
 *   B. PHOIBLE mean-pool offline — universal 14-dim feature vector
 *      derived from the PHOIBLE phonological feature set.
 *      No network required. Suitable for all low-resource languages.
 *
 * Blend: 0.4 * embedding + 0.6 * featureWeighted (configurable).
 */

import type { LangFamily } from './morphoNucleus';

import { meanPoolPhoible, cosineSimilarity } from './phoible';

// ── Memoization for PHOIBLE mean-pool ─────────────────────────────────────────
// meanPoolPhoible is pure over its phone sequence; cache by joined key.
// FIFO eviction at MAX_CACHE entries — bounded memory, no timeout (sync code).
const MEAN_POOL_CACHE_MAX = 256;
const meanPoolCache = new Map<string, Float32Array>();

function meanPoolPhoibleCached(phones: string[]): Float32Array {
  const key = phones.join('|');
  const hit = meanPoolCache.get(key);
  if (hit) return hit;
  const vec = meanPoolPhoible(phones);
  if (meanPoolCache.size >= MEAN_POOL_CACHE_MAX) {
    // FIFO eviction: drop the oldest insertion (Map preserves insertion order)
    const firstKey = meanPoolCache.keys().next().value;
    if (firstKey !== undefined) meanPoolCache.delete(firstKey);
  }
  meanPoolCache.set(key, vec);
  return vec;
}

// ── CharsiuG2P stub (runtime) ─────────────────────────────────────────────────
// When CharsiuG2P service is available, call it here.
// Returns IPA string for supported langs (SIN/JAP/KOR).
// Stub returns empty array — will fall through to PHOIBLE backend.

async function charsiuG2P(
  _word: string,
  _lang: string
): Promise<string[]> {
  // TODO: integrate CharsiuG2P REST endpoint
  // POST /g2p { text: word, lang } → { ipa: string }
  return [];
}

const CHARSIU_FAMILIES: LangFamily[] = ['SIN', 'JAP', 'KOR'];

// ── Public API ────────────────────────────────────────────────────────────────

export interface EmbeddingScoreResult {
  score: number; // 0–1
  backend: 'charsiu' | 'phoible';
}

/**
 * Compute embedding-level phonetic similarity between two phone sequences.
 * @param phonesA  IPA / ARPABET phones for word A
 * @param phonesB  IPA / ARPABET phones for word B
 * @param family   Language family (determines backend preference)
 * @param lang     Language code (for CharsiuG2P)
 */
export async function embeddingScore(
  phonesA: string[],
  phonesB: string[],
  family: LangFamily,
  lang: string
): Promise<EmbeddingScoreResult> {
  // Try CharsiuG2P for preferred families
  if (CHARSIU_FAMILIES.includes(family)) {
    const [ipaA, ipaB] = await Promise.all([
      charsiuG2P(phonesA.join(''), lang),
      charsiuG2P(phonesB.join(''), lang),
    ]);
    if (ipaA.length > 0 && ipaB.length > 0) {
      const vecA = meanPoolPhoibleCached(ipaA);
      const vecB = meanPoolPhoibleCached(ipaB);
      return { score: Math.max(0, cosineSimilarity(vecA, vecB)), backend: 'charsiu' };
    }
  }

  // PHOIBLE offline fallback — universal
  const vecA = meanPoolPhoibleCached(phonesA);
  const vecB = meanPoolPhoibleCached(phonesB);
  return { score: Math.max(0, cosineSimilarity(vecA, vecB)), backend: 'phoible' };
}

/**
 * Blend embedding score with feature-weighted score.
 * @param featureScore  Level-3 feature-weighted score (0–1)
 * @param embScore      Level-4 embedding score (0–1)
 * @param embWeight     Blend weight for embedding (default 0.4)
 */
export function blendScores(
  featureScore: number,
  embScore: number,
  embWeight = 0.4
): number {
  return featureScore * (1 - embWeight) + embScore * embWeight;
}

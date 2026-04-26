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
      const vecA = meanPoolPhoible(ipaA);
      const vecB = meanPoolPhoible(ipaB);
      return { score: Math.max(0, cosineSimilarity(vecA, vecB)), backend: 'charsiu' };
    }
  }

  // PHOIBLE offline fallback — universal
  const vecA = meanPoolPhoible(phonesA);
  const vecB = meanPoolPhoible(phonesB);
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

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

// ── PHOIBLE 14-dim feature set (binary) ──────────────────────────────────────
// Dimensions: syllabic, consonantal, sonorant, continuant, voice, nasal,
//             strident, lateral, labial, coronal, dorsal, pharyngeal,
//             high, low
// Source: PHOIBLE 2.0 feature schema (simplified to 14 core dimensions)

type PhoneVector = number[]; // length 14, values -1 | 0 | 1

const PHONE_VECTORS: Record<string, PhoneVector> = {
  // Vowels
  a:  [ 1,-1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  e:  [ 1,-1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  i:  [ 1,-1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  o:  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  u:  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  // Nasals
  m:  [ 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0],
  n:  [ 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  ŋ:  [ 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0],
  // Stops
  p:  [ 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  b:  [ 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  t:  [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  d:  [ 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  k:  [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  g:  [ 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  // Fricatives
  f:  [ 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
  v:  [ 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
  s:  [ 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  z:  [ 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  ʃ:  [ 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0],
  ʒ:  [ 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0],
  h:  [ 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  // Approximants / liquids
  l:  [ 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  r:  [ 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  j:  [ 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  w:  [ 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  // Tonal / click placeholder
  ʔ:  [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/** Mean-pool a sequence of phone vectors into one 14-dim vector. */
function meanPool(phones: string[]): PhoneVector {
  const dim = 14;
  const sum = new Array<number>(dim).fill(0);
  let count = 0;
  for (const ph of phones) {
    const vec = PHONE_VECTORS[ph.toLowerCase()];
    if (!vec) continue;
    for (let i = 0; i < dim; i++) sum[i] += vec[i];
    count++;
  }
  if (count === 0) return sum;
  return sum.map(v => v / count);
}

/** Cosine similarity between two vectors. */
function cosine(a: PhoneVector, b: PhoneVector): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
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
      const vecA = meanPool(ipaA);
      const vecB = meanPool(ipaB);
      return { score: Math.max(0, cosine(vecA, vecB)), backend: 'charsiu' };
    }
  }

  // PHOIBLE offline fallback — universal
  const vecA = meanPool(phonesA);
  const vecB = meanPool(phonesB);
  return { score: Math.max(0, cosine(vecA, vecB)), backend: 'phoible' };
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

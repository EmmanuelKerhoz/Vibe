/**
 * phoible.ts
 * Centralized PHOIBLE mean-pool embedding scoring for the rhyme engine.
 *
 * Provides a universal 14-dim feature vector mapped from the PHOIBLE
 * phonological feature set to perform cosine similarity.
 */

export const PHOIBLE_DIM = 14;

// ── PHOIBLE 14-dim feature set (binary) ──────────────────────────────────────
// Dimensions: syllabic, consonantal, sonorant, continuant, voice, nasal,
//             strident, lateral, labial, coronal, dorsal, pharyngeal,
//             high, low

export const PHONE_VECTORS: Record<string, readonly number[]> = {
  // Vowels
  a:  [ 1,-1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  e:  [ 1,-1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  i:  [ 1,-1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  o:  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  u:  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  'ɑ':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  'æ':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0],
  'ɛ':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
  'ɔ':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
  'ə':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  'ɪ':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0],
  'ʊ':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1],
  'y':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1],
  'ø':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1],
  'ü':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1],
  'ö':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1],
  'ä':  [ 1,-1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0],
  // Nasals
  m:  [ 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0],
  n:  [ 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  'ŋ':[ 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0],
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
  'ʃ':[ 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0],
  'ʒ':[ 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0],
  h:  [ 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  // Approximants / liquids
  l:  [ 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  r:  [ 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  j:  [ 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  w:  [ 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  // Tonal / click placeholder
  'ʔ':[ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const ZERO_VEC = new Float32Array(PHOIBLE_DIM);

/** Mean-pool an iterable/string of phone characters into one 14-dim vector. */
export function meanPoolPhoible(phones: Iterable<string>): Float32Array {
  const sum = new Float32Array(PHOIBLE_DIM);
  let count = 0;
  for (let ph of phones) {
    const vec = PHONE_VECTORS[ph.toLowerCase()];
    if (!vec) continue;
    for (let i = 0; i < PHOIBLE_DIM; i++) sum[i]! += vec[i]!;
    count++;
  }
  if (count === 0) return sum;
  for (let i = 0; i < PHOIBLE_DIM; i++) sum[i]! /= count;
  return sum;
}

/** Cosine similarity between two generic Float32 vectors. */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < PHOIBLE_DIM; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! ** 2;
    normB += b[i]! ** 2;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

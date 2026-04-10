/**
 * phoneme_embedding.ts — Lyricist v4.1 Remediation #5
 * Scoring niveau 4 : cosine similarity sur embeddings phonémiques.
 * Priorité : ALGO-KWA, ALGO-CRV, ALGO-SIN, ALGO-TAI, ALGO-VIET.
 */

// Vecteur 5D : [voisement, lieu, mode, nasalité, hauteur_tonale]
const PHONEME_VECTORS: Record<string, number[]> = {
  a:    [0.0, 0.5, 0.8, 0.0, 0.0],
  'aː': [0.0, 0.5, 0.8, 0.0, 0.1],
  e:    [0.0, 0.8, 0.6, 0.0, 0.0],
  ɛ:    [0.0, 0.7, 0.65, 0.0, 0.0],
  i:    [0.0, 1.0, 0.3, 0.0, 0.0],
  'iː': [0.0, 1.0, 0.3, 0.0, 0.1],
  o:    [0.0, 0.3, 0.6, 0.0, 0.5],
  ɔ:    [0.0, 0.2, 0.7, 0.0, 0.5],
  u:    [0.0, 0.1, 0.3, 0.0, 1.0],
  'uː': [0.0, 0.1, 0.3, 0.0, 1.0],
  p:    [0.0, 0.0, 0.0, 0.0, 0.0],
  b:    [1.0, 0.0, 0.0, 0.0, 0.0],
  t:    [0.0, 0.3, 0.0, 0.0, 0.0],
  d:    [1.0, 0.3, 0.0, 0.0, 0.0],
  k:    [0.0, 0.7, 0.0, 0.0, 0.0],
  g:    [1.0, 0.7, 0.0, 0.0, 0.0],
  m:    [1.0, 0.0, 0.0, 1.0, 0.0],
  n:    [1.0, 0.3, 0.0, 1.0, 0.0],
  ŋ:    [1.0, 0.7, 0.0, 1.0, 0.0],
  s:    [0.0, 0.35, 0.5, 0.0, 0.0],
  z:    [1.0, 0.35, 0.5, 0.0, 0.0],
  l:    [1.0, 0.3, 0.9, 0.0, 0.0],
  r:    [1.0, 0.35, 0.85, 0.0, 0.0],
  H:    [0.0, 0.0, 0.0, 0.0, 1.0],
  M:    [0.0, 0.0, 0.0, 0.0, 0.5],
  L:    [0.0, 0.0, 0.0, 0.0, 0.0],
  HL:   [0.0, 0.0, 0.0, 0.0, 0.7],
  LH:   [0.0, 0.0, 0.0, 0.0, 0.3],
};

const DIM = 5;

function phonemeToVector(phone: string): number[] {
  return PHONEME_VECTORS[phone] ?? new Array(DIM).fill(0);
}

export function rnToEmbedding(rnPhones: string[]): number[] {
  if (rnPhones.length === 0) return new Array(DIM).fill(0);
  const vecs = rnPhones.map(phonemeToVector);
  return Array.from({ length: DIM }, (_, i) => vecs.reduce((s, v) => s + v[i], 0) / vecs.length);
}

function cosineSimilarity(v1: number[], v2: number[]): number {
  const dot = v1.reduce((s, a, i) => s + a * v2[i], 0);
  const n1 = Math.sqrt(v1.reduce((s, a) => s + a * a, 0));
  const n2 = Math.sqrt(v2.reduce((s, a) => s + a * a, 0));
  if (n1 === 0 || n2 === 0) return 0;
  return Math.round(dot / (n1 * n2) * 10000) / 10000;
}

export interface EmbeddingScore {
  score: number;
  method: 'embedding-static' | 'embedding-neural';
  embeddingRn1: number[];
  embeddingRn2: number[];
}

export type NeuralEncoder = { encode: (phones: string[]) => number[] };

export function scoreEmbedding(
  rn1: string[],
  rn2: string[],
  neuralModel?: NeuralEncoder
): EmbeddingScore {
  const emb1 = neuralModel ? neuralModel.encode(rn1) : rnToEmbedding(rn1);
  const emb2 = neuralModel ? neuralModel.encode(rn2) : rnToEmbedding(rn2);
  return {
    score: cosineSimilarity(emb1, emb2),
    method: neuralModel ? 'embedding-neural' : 'embedding-static',
    embeddingRn1: emb1,
    embeddingRn2: emb2,
  };
}

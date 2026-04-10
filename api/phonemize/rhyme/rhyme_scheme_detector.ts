/**
 * rhyme_scheme_detector.ts — Lyricist v4.1 Remediation #2
 * Détection de schémas de rime (AABB, ABAB, etc.) sur un bloc de N vers.
 */

export interface SchemeResult {
  scheme: string;
  confidence: number;
  pairs: Array<[number, number, number]>; // [i, j, score]
  labels: string[];
}

export type ScorerFn = (text1: string, text2: string, lang: string) => Promise<{ score: number }>;

const SCHEME_PATTERNS: Record<string, Array<[number, number]>> = {
  AABB: [[0,1],[2,3]],
  ABAB: [[0,2],[1,3]],
  ABBA: [[0,3],[1,2]],
  ABCB: [[1,3]],
  AAAA: [[0,1],[1,2],[2,3]],
  ABCC: [[2,3]],
};

export async function detectScheme(
  verses: string[],
  scorer: ScorerFn,
  lang = 'fr',
  threshold = 0.75
): Promise<SchemeResult> {
  const n = verses.length;
  if (n < 2) return { scheme: '?', confidence: 0, pairs: [], labels: ['A'] };

  const matrix = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const { score } = await scorer(verses[i], verses[j], lang);
      matrix.set(`${i},${j}`, score);
    }
  }

  const labels = assignLabels(n, matrix, threshold);
  const { scheme, confidence } = matchKnownScheme(labels, n, matrix, threshold);
  const pairs: Array<[number, number, number]> = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = matrix.get(`${i},${j}`) ?? 0;
      if (s >= threshold) pairs.push([i, j, s]);
    }
  }

  return { scheme, confidence, pairs, labels };
}

function assignLabels(n: number, matrix: Map<string, number>, threshold: number): string[] {
  const labels = new Array<string>(n).fill('?');
  let code = 65; // 'A'
  for (let i = 0; i < n; i++) {
    if (labels[i] !== '?') continue;
    labels[i] = String.fromCharCode(code);
    for (let j = i + 1; j < n; j++) {
      if (labels[j] === '?' && (matrix.get(`${i},${j}`) ?? 0) >= threshold) {
        labels[j] = String.fromCharCode(code);
      }
    }
    code++;
  }
  return labels;
}

function matchKnownScheme(
  labels: string[], n: number, matrix: Map<string, number>, threshold: number
): { scheme: string; confidence: number } {
  const labelStr = labels.slice(0, 4).join('');
  for (const [scheme, pairs] of Object.entries(SCHEME_PATTERNS)) {
    if (labelStr.startsWith(scheme.slice(0, n)) || scheme.startsWith(labelStr.slice(0, scheme.length))) {
      const scores = pairs
        .filter(([a, b]) => Math.max(a, b) < n)
        .map(([a, b]) => matrix.get(`${Math.min(a,b)},${Math.max(a,b)}`) ?? 0);
      const confidence = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0.5;
      return { scheme, confidence: Math.round(confidence * 1000) / 1000 };
    }
  }
  return { scheme: labelStr, confidence: 0.5 };
}

/**
 * tonalDistance.ts — Tonal penalty with per-language distance matrices.
 * Supports both numeric tone numbers (e.g., zh: 1-4) and alphabetic
 * tone labels (e.g., vi/th/ha: H/M/L/MH/ML/F).
 */

export type TonalLang = 'zh' | 'yue' | 'th' | 'lo' | 'vi' | 'ha' | 'kwa' | 'yo';

// ─── Per-language tone distance matrices ────────────────────────────────────
// Values are 0 (identical) to 1 (maximally different).
// Only upper triangle stored; access via toneDistance(a, b, lang).

/** Mandarin 4 tones: 1=flat,2=rising,3=dipping,4=falling */
const ZH_DIST: Record<string, Record<string, number>> = {
  '1': { '1': 0,    '2': 0.3,  '3': 0.6,  '4': 0.8 },
  '2': { '1': 0.3,  '2': 0,    '3': 0.4,  '4': 0.6 },
  '3': { '1': 0.6,  '2': 0.4,  '3': 0,    '4': 0.5 },
  '4': { '1': 0.8,  '2': 0.6,  '3': 0.5,  '4': 0   },
};

/** Cantonese 6 tones (1-6) */
const YUE_DIST: Record<string, Record<string, number>> = {
  '1': { '1': 0,   '2': 0.3, '3': 0.5, '4': 0.7, '5': 0.6, '6': 0.8 },
  '2': { '1': 0.3, '2': 0,   '3': 0.3, '4': 0.6, '5': 0.5, '6': 0.7 },
  '3': { '1': 0.5, '2': 0.3, '3': 0,   '4': 0.5, '5': 0.4, '6': 0.6 },
  '4': { '1': 0.7, '2': 0.6, '3': 0.5, '4': 0,   '5': 0.3, '6': 0.5 },
  '5': { '1': 0.6, '2': 0.5, '3': 0.4, '4': 0.3, '5': 0,   '6': 0.3 },
  '6': { '1': 0.8, '2': 0.7, '3': 0.6, '4': 0.5, '5': 0.3, '6': 0   },
};

/**
 * Generic alphabetic-label tone distance.
 * Labels: H (high), M (mid), L (low), MH (mid-rising), ML (mid-falling),
 * F (falling), R (rising), LH (low-rising).
 */
const ALPHA_DIST: Record<string, Record<string, number>> = {
  H:  { H: 0,   M: 0.4, L: 1.0, MH: 0.3, ML: 0.7, F: 0.6, R: 0.5, LH: 0.8 },
  M:  { H: 0.4, M: 0,   L: 0.5, MH: 0.2, ML: 0.3, F: 0.4, R: 0.3, LH: 0.5 },
  L:  { H: 1.0, M: 0.5, L: 0,   MH: 0.7, ML: 0.4, F: 0.3, R: 0.6, LH: 0.3 },
  MH: { H: 0.3, M: 0.2, L: 0.7, MH: 0,   ML: 0.5, F: 0.5, R: 0.3, LH: 0.6 },
  ML: { H: 0.7, M: 0.3, L: 0.4, MH: 0.5, ML: 0,   F: 0.3, R: 0.5, LH: 0.4 },
  F:  { H: 0.6, M: 0.4, L: 0.3, MH: 0.5, ML: 0.3, F: 0,   R: 0.7, LH: 0.3 },
  R:  { H: 0.5, M: 0.3, L: 0.6, MH: 0.3, ML: 0.5, F: 0.7, R: 0,   LH: 0.4 },
  LH: { H: 0.8, M: 0.5, L: 0.3, MH: 0.6, ML: 0.4, F: 0.3, R: 0.4, LH: 0   },
};

function lookupDist(
  matrix: Record<string, Record<string, number>>,
  a: string,
  b: string
): number | null {
  const row = matrix[a];
  if (!row) return null;
  const val = row[b];
  if (val === undefined) return null;
  return val;
}

function tonalDistance(toneA: string, toneB: string, lang: TonalLang): number {
  if (toneA === toneB) return 0;

  // Normalise: strip trailing whitespace
  const a = toneA.trim().toUpperCase();
  const b = toneB.trim().toUpperCase();
  if (a === b) return 0;

  // CJK numeric tones
  if (lang === 'zh') {
    const d = lookupDist(ZH_DIST, a, b) ?? lookupDist(ZH_DIST, b, a);
    if (d != null) return d;
  }
  if (lang === 'yue') {
    const d = lookupDist(YUE_DIST, a, b) ?? lookupDist(YUE_DIST, b, a);
    if (d != null) return d;
  }

  // Alphabetic labels — covers th/lo/vi/ha/kwa/yo
  const d = lookupDist(ALPHA_DIST, a, b) ?? lookupDist(ALPHA_DIST, b, a);
  if (d != null) return d;

  // Fallback: if tones differ, moderate distance
  return 0.5;
}

export function applyTonalPenalty(
  baseScore: number,
  lang: TonalLang,
  toneA: string,
  toneB: string,
  weight = 0.25
): number {
  if (!toneA || !toneB) return baseScore;
  const dist = tonalDistance(toneA, toneB, lang);
  if (dist === 0) return baseScore;
  const clampedWeight = Math.max(0, Math.min(1, weight));
  return baseScore * (1 - clampedWeight * dist);
}

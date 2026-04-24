/**
 * tonalDistance.ts
 * Step 4 — Unified tonal distance matrices for all tonal language families.
 * Returns a penalty coefficient [0, 1] where 0 = identical tone, 1 = maximal distance.
 * Symmetric. Falls back to median distance when tone is unknown.
 *
 * Covered: ZH (Mandarin), YUE (Cantonese), TH (Thai), LO (Lao),
 *           VI (Vietnamese), HA (Hausa), KWA (Baoulé/Dioula/Ewe/Mina),
 *           YO (Yoruba).
 */

export type TonalLang = 'zh' | 'yue' | 'th' | 'lo' | 'vi' | 'ha' | 'kwa' | 'yo';

/** Flat symmetric matrix stored as [toneA][toneB] → distance 0–1 */
type ToneMatrix = Record<string, Record<string, number>>;

// ── Mandarin (4 tones + neutral 0) ──────────────────────────────────────────
const ZH_MATRIX: ToneMatrix = {
  '1': { '1': 0,    '2': 0.25, '3': 0.5,  '4': 0.75, '0': 0.4 },
  '2': { '1': 0.25, '2': 0,    '3': 0.5,  '4': 0.5,  '0': 0.4 },
  '3': { '1': 0.5,  '2': 0.5,  '3': 0,    '4': 0.75, '0': 0.4 },
  '4': { '1': 0.75, '2': 0.5,  '3': 0.75, '4': 0,    '0': 0.4 },
  '0': { '1': 0.4,  '2': 0.4,  '3': 0.4,  '4': 0.4,  '0': 0   },
};

// ── Cantonese (6 tones) ──────────────────────────────────────────────────────
const YUE_MATRIX: ToneMatrix = {
  '1': { '1': 0,    '2': 0.2,  '3': 0.4,  '4': 0.6,  '5': 0.8,  '6': 1.0  },
  '2': { '1': 0.2,  '2': 0,    '3': 0.2,  '4': 0.6,  '5': 0.6,  '6': 0.8  },
  '3': { '1': 0.4,  '2': 0.2,  '3': 0,    '4': 0.8,  '5': 0.6,  '6': 0.6  },
  '4': { '1': 0.6,  '2': 0.6,  '3': 0.8,  '4': 0,    '5': 0.2,  '6': 0.4  },
  '5': { '1': 0.8,  '2': 0.6,  '3': 0.6,  '4': 0.2,  '5': 0,    '6': 0.2  },
  '6': { '1': 1.0,  '2': 0.8,  '3': 0.6,  '4': 0.4,  '5': 0.2,  '6': 0   },
};

// ── Thai (5 tones: mid/low/falling/high/rising) ───────────────────────────────
const TH_MATRIX: ToneMatrix = {
  'mid':     { 'mid': 0,    'low': 0.3,  'falling': 0.5,  'high': 0.7,  'rising': 0.5  },
  'low':     { 'mid': 0.3,  'low': 0,    'falling': 0.3,  'high': 0.7,  'rising': 0.5  },
  'falling': { 'mid': 0.5,  'low': 0.3,  'falling': 0,    'high': 0.5,  'rising': 0.7  },
  'high':    { 'mid': 0.7,  'low': 0.7,  'falling': 0.5,  'high': 0,    'rising': 0.3  },
  'rising':  { 'mid': 0.5,  'low': 0.5,  'falling': 0.7,  'high': 0.3,  'rising': 0   },
};

// ── Lao (6 tones) — mirrors Thai structure with Lao-specific contours ────────
const LO_MATRIX: ToneMatrix = {
  '1': { '1': 0,    '2': 0.2,  '3': 0.4,  '4': 0.6,  '5': 0.8,  '6': 1.0  },
  '2': { '1': 0.2,  '2': 0,    '3': 0.3,  '4': 0.5,  '5': 0.7,  '6': 0.9  },
  '3': { '1': 0.4,  '2': 0.3,  '3': 0,    '4': 0.3,  '5': 0.5,  '6': 0.7  },
  '4': { '1': 0.6,  '2': 0.5,  '3': 0.3,  '4': 0,    '5': 0.3,  '6': 0.5  },
  '5': { '1': 0.8,  '2': 0.7,  '3': 0.5,  '4': 0.3,  '5': 0,    '6': 0.3  },
  '6': { '1': 1.0,  '2': 0.9,  '3': 0.7,  '4': 0.5,  '5': 0.3,  '6': 0   },
};

// ── Vietnamese (6 tones: ngang/huyền/sắc/hỏi/ngã/nặng) ───────────────────────
const VI_MATRIX: ToneMatrix = {
  'ngang': { 'ngang': 0,    'huyen': 0.3,  'sac': 0.5,  'hoi': 0.6,  'nga': 0.7,  'nang': 0.8  },
  'huyen': { 'ngang': 0.3,  'huyen': 0,    'sac': 0.6,  'hoi': 0.5,  'nga': 0.8,  'nang': 0.6  },
  'sac':   { 'ngang': 0.5,  'huyen': 0.6,  'sac': 0,    'hoi': 0.4,  'nga': 0.3,  'nang': 0.7  },
  'hoi':   { 'ngang': 0.6,  'huyen': 0.5,  'sac': 0.4,  'hoi': 0,    'nga': 0.3,  'nang': 0.5  },
  'nga':   { 'ngang': 0.7,  'huyen': 0.8,  'sac': 0.3,  'hoi': 0.3,  'nga': 0,    'nang': 0.4  },
  'nang':  { 'ngang': 0.8,  'huyen': 0.6,  'sac': 0.7,  'hoi': 0.5,  'nga': 0.4,  'nang': 0   },
};

// ── Hausa (3 tones: H/L/F) ───────────────────────────────────────────────────
const HA_MATRIX: ToneMatrix = {
  'H': { 'H': 0,    'L': 0.5,  'F': 0.3  },
  'L': { 'H': 0.5,  'L': 0,    'F': 0.3  },
  'F': { 'H': 0.3,  'L': 0.3,  'F': 0    },
};

// ── KWA — Baoulé/Dioula/Ewe/Mina (2 register tones: H/L + M for Ewe) ────────
const KWA_MATRIX: ToneMatrix = {
  'H': { 'H': 0,    'L': 0.6,  'M': 0.3  },
  'L': { 'H': 0.6,  'L': 0,    'M': 0.3  },
  'M': { 'H': 0.3,  'L': 0.3,  'M': 0    },
};

// ── Yoruba (3 tones: H/M/L) ──────────────────────────────────────────────────
const YO_MATRIX: ToneMatrix = {
  'H': { 'H': 0,    'M': 0.35, 'L': 0.7  },
  'M': { 'H': 0.35, 'M': 0,    'L': 0.35 },
  'L': { 'H': 0.7,  'L': 0,    'M': 0.35 },
};

const MATRICES: Record<TonalLang, ToneMatrix> = {
  zh: ZH_MATRIX,
  yue: YUE_MATRIX,
  th: TH_MATRIX,
  lo: LO_MATRIX,
  vi: VI_MATRIX,
  ha: HA_MATRIX,
  kwa: KWA_MATRIX,
  yo: YO_MATRIX,
};

/** Median distance value for a matrix — used as fallback when tone is unknown. */
function matrixMedian(matrix: ToneMatrix): number {
  const values: number[] = [];
  for (const row of Object.values(matrix))
    for (const [key, v] of Object.entries(row))
      if (key !== Object.keys(row)[0]) values.push(v); // skip diagonal
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)] ?? 0.5;
}

const MEDIANS: Record<TonalLang, number> = Object.fromEntries(
  (Object.entries(MATRICES) as [TonalLang, ToneMatrix][]).map(([lang, m]) => [
    lang,
    matrixMedian(m),
  ])
) as Record<TonalLang, number>;

/**
 * Returns tonal distance [0–1].
 * @param lang    Tonal language code
 * @param toneA   Tone label of word A (string or number)
 * @param toneB   Tone label of word B
 * @returns       Penalty coefficient — multiply into rhyme score.
 */
export function tonalDistance(
  lang: TonalLang,
  toneA: string | number,
  toneB: string | number
): number {
  const matrix = MATRICES[lang];
  if (!matrix) return 0; // non-tonal lang — no penalty

  const a = String(toneA);
  const b = String(toneB);

  // Symmetric lookup
  const dist = matrix[a]?.[b] ?? matrix[b]?.[a];
  if (dist !== undefined) return dist;

  // Unknown tone — return median
  return MEDIANS[lang];
}

/**
 * Apply tonal penalty to an existing rhyme score.
 * penalty = dist * sensitivity (0–1 configurable)
 */
export function applyTonalPenalty(
  score: number,
  lang: TonalLang,
  toneA: string | number,
  toneB: string | number,
  sensitivity = 0.5
): number {
  const dist = tonalDistance(lang, toneA, toneB);
  return score * (1 - dist * sensitivity);
}

/**
 * tonalMatrix.ts
 * Unified tonal distance matrices for all tonal language families.
 * Distance = 0.0 (identical) → 1.0 (maximally distant).
 * Matrices are symmetric; access via getTonalDistance(langFamily, toneA, toneB).
 *
 * Covered: ZH (Mandarin), YUE (Cantonese), TH (Thai), LO (Lao),
 *          VI (Vietnamese), HA (Hausa), KWA (Baoulé/Ewe/Dioula/Mina), YRB (Yoruba)
 */

export type TonalFamily = 'ZH' | 'YUE' | 'TH' | 'LO' | 'VI' | 'HA' | 'KWA' | 'YRB';

// Matrices stored as flat Record<`${toneA}-${toneB}`, distance>
// Symmetric: only upper triangle defined; lookup normalises order.

const MATRICES: Record<TonalFamily, Record<string, number>> = {
  // Mandarin: 4 tones (1=flat, 2=rising, 3=dipping, 4=falling) + 0=neutral
  ZH: {
    '1-1': 0.0, '1-2': 0.3, '1-3': 0.6, '1-4': 0.5, '1-0': 0.2,
    '2-2': 0.0, '2-3': 0.4, '2-4': 0.7, '2-0': 0.3,
    '3-3': 0.0, '3-4': 0.3, '3-0': 0.4,
    '4-4': 0.0, '4-0': 0.3,
    '0-0': 0.0,
  },
  // Cantonese: 6 tones
  YUE: {
    '1-1': 0.0, '1-2': 0.2, '1-3': 0.4, '1-4': 0.5, '1-5': 0.6, '1-6': 0.7,
    '2-2': 0.0, '2-3': 0.2, '2-4': 0.4, '2-5': 0.5, '2-6': 0.6,
    '3-3': 0.0, '3-4': 0.3, '3-5': 0.4, '3-6': 0.5,
    '4-4': 0.0, '4-5': 0.2, '4-6': 0.4,
    '5-5': 0.0, '5-6': 0.2,
    '6-6': 0.0,
  },
  // Thai: 5 tones (mid/low/falling/high/rising)
  TH: {
    'mid-mid': 0.0,   'mid-low': 0.4,  'mid-falling': 0.3, 'mid-high': 0.5,  'mid-rising': 0.4,
    'low-low': 0.0,   'low-falling': 0.3, 'low-high': 0.7, 'low-rising': 0.5,
    'falling-falling': 0.0, 'falling-high': 0.6, 'falling-rising': 0.4,
    'high-high': 0.0, 'high-rising': 0.3,
    'rising-rising': 0.0,
  },
  // Lao: 6 tones (low/mid/high/rising/high-falling/low-falling)
  LO: {
    'low-low': 0.0,   'low-mid': 0.3,  'low-high': 0.6, 'low-rising': 0.5,  'low-hf': 0.6,  'low-lf': 0.2,
    'mid-mid': 0.0,   'mid-high': 0.4, 'mid-rising': 0.3, 'mid-hf': 0.5,   'mid-lf': 0.3,
    'high-high': 0.0, 'high-rising': 0.2, 'high-hf': 0.3, 'high-lf': 0.6,
    'rising-rising': 0.0, 'rising-hf': 0.3, 'rising-lf': 0.5,
    'hf-hf': 0.0,     'hf-lf': 0.4,
    'lf-lf': 0.0,
  },
  // Vietnamese: 6 tones (ngang/huyền/sắc/nặng/hỏi/ngã)
  VI: {
    'ngang-ngang': 0.0, 'ngang-huyen': 0.3, 'ngang-sac': 0.4, 'ngang-nang': 0.6, 'ngang-hoi': 0.5, 'ngang-nga': 0.5,
    'huyen-huyen': 0.0, 'huyen-sac': 0.5,   'huyen-nang': 0.4, 'huyen-hoi': 0.4, 'huyen-nga': 0.4,
    'sac-sac': 0.0,     'sac-nang': 0.5,    'sac-hoi': 0.4,    'sac-nga': 0.3,
    'nang-nang': 0.0,   'nang-hoi': 0.4,    'nang-nga': 0.5,
    'hoi-hoi': 0.0,     'hoi-nga': 0.2,
    'nga-nga': 0.0,
  },
  // Hausa: 3 tones (H/L/F=falling)
  HA: {
    'H-H': 0.0, 'H-L': 0.5, 'H-F': 0.3,
    'L-L': 0.0, 'L-F': 0.4,
    'F-F': 0.0,
  },
  // KWA (Baoulé/Ewe/Dioula/Mina): 3 register tones H/M/L
  KWA: {
    'H-H': 0.0, 'H-M': 0.3, 'H-L': 0.7,
    'M-M': 0.0, 'M-L': 0.3,
    'L-L': 0.0,
  },
  // Yoruba: 3 tones H/M/L
  YRB: {
    'H-H': 0.0, 'H-M': 0.3, 'H-L': 0.8,
    'M-M': 0.0, 'M-L': 0.3,
    'L-L': 0.0,
  },
};

/** Normalise key so a-b == b-a */
function normaliseKey(a: string, b: string): string {
  return a <= b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Return tonal distance [0, 1] between two tones for a given family.
 * Returns median distance (0.4) if the pair is unknown.
 */
export function getTonalDistance(
  family: TonalFamily,
  toneA: string | number,
  toneB: string | number
): number {
  const matrix = MATRICES[family];
  if (!matrix) return 0.4;
  const key = normaliseKey(String(toneA), String(toneB));
  return matrix[key] ?? 0.4;
}

/**
 * Apply tonal penalty to a base phonetic score.
 * penalty = tonalDistance * baseScore (proportional — preserves scale).
 */
export function applyTonalPenalty(
  baseScore: number,
  family: TonalFamily,
  toneA: string | number,
  toneB: string | number,
  weight = 0.25
): number {
  const dist = getTonalDistance(family, toneA, toneB);
  return baseScore * (1 - weight * dist);
}

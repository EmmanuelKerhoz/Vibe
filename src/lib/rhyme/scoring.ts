/**
 * Rhyme Engine v3 — Scoring
 *
 * L1 exact | L2 PED | L3 feature-weighted | L4 PHOIBLE mean-pool embedding
 * Tone penalty from toneMatrix. Position threshold adjustment.
 */

import type { FamilyId, LangCode, RhymeCategory, RhymeNucleus } from './types';
import { getTonePenalty } from './toneMatrix';
import { meanPoolPhoible, cosineSimilarity } from './phoible';

export function phonemeEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return 1;
  const la = a.length, lb = b.length, cols = lb + 1;
  const dp = new Int32Array((la + 1) * cols);
  for (let j = 0; j <= lb; j++) dp[j] = j;
  for (let i = 1; i <= la; i++) dp[i * cols] = i;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i * cols + j] = Math.min(
        dp[(i - 1) * cols + j]! + 1,
        dp[i * cols + j - 1]! + 1,
        dp[(i - 1) * cols + j - 1]! + cost,
      );
    }
  }
  return dp[la * cols + lb]! / Math.max(la, lb);
}

function embeddingScore(vA: string, vB: string): number {
  return !vA || !vB ? 0 : cosineSimilarity(meanPoolPhoible(vA), meanPoolPhoible(vB));
}

// ─── Family config ────────────────────────────────────────────────────────────

interface FamilyScoringConfig {
  vowelWeight: number; codaWeight: number; toneWeight: number;
  tonePenaltyFactor: number; useEmbedding: boolean; embeddingBlend: number;
}

const FAMILY_CONFIG: Record<FamilyId, FamilyScoringConfig> = {
  ROM:      { vowelWeight:0.65, codaWeight:0.35, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  GER:      { vowelWeight:0.60, codaWeight:0.40, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  SLV:      { vowelWeight:0.60, codaWeight:0.40, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  SEM:      { vowelWeight:0.50, codaWeight:0.50, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  TRK:      { vowelWeight:0.70, codaWeight:0.30, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  FIN:      { vowelWeight:0.70, codaWeight:0.30, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  BNT:      { vowelWeight:0.70, codaWeight:0.30, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  CJK:      { vowelWeight:0.40, codaWeight:0.20, toneWeight:0.40, tonePenaltyFactor:0.60, useEmbedding:true,  embeddingBlend:0.40 },
  TAI:      { vowelWeight:0.40, codaWeight:0.20, toneWeight:0.40, tonePenaltyFactor:0.50, useEmbedding:true,  embeddingBlend:0.40 },
  VIET:     { vowelWeight:0.40, codaWeight:0.20, toneWeight:0.40, tonePenaltyFactor:0.50, useEmbedding:true,  embeddingBlend:0.40 },
  KWA:      { vowelWeight:0.45, codaWeight:0.20, toneWeight:0.35, tonePenaltyFactor:0.45, useEmbedding:false, embeddingBlend:0.0  },
  CRV:      { vowelWeight:0.45, codaWeight:0.20, toneWeight:0.35, tonePenaltyFactor:0.45, useEmbedding:false, embeddingBlend:0.0  },
  YRB:      { vowelWeight:0.45, codaWeight:0.20, toneWeight:0.35, tonePenaltyFactor:0.45, useEmbedding:false, embeddingBlend:0.0  },
  IIR:      { vowelWeight:0.65, codaWeight:0.35, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  AUS:      { vowelWeight:0.65, codaWeight:0.35, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  DRA:      { vowelWeight:0.65, codaWeight:0.35, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  CRE:      { vowelWeight:0.60, codaWeight:0.40, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
  FALLBACK: { vowelWeight:0.60, codaWeight:0.40, toneWeight:0.0,  tonePenaltyFactor:0.0,  useEmbedding:false, embeddingBlend:0.0  },
};

const THRESHOLDS: Array<[number, RhymeCategory]> = [
  [0.92,'perfect'],[0.80,'rich'],[0.60,'sufficient'],[0.35,'weak'],[0.00,'none'],
];

/**
 * Categorize a rhyme score into one of the 5 RhymeCategory buckets.
 * Thresholds: ≥0.92 perfect, ≥0.80 rich, ≥0.60 sufficient, ≥0.35 weak, else none.
 */
export function categorize(score: number): RhymeCategory {
  for (const [t, cat] of THRESHOLDS) if (score >= t) return cat;
  return 'none';
}

/** Backwards-compatible alias used by scoreNuclei (British spelling). */
const categorise = categorize;

export type RhymePositionMode = 'end' | 'internal' | 'initial' | 'all';

const POSITION_THRESHOLD_ADJUST: Record<RhymePositionMode, number> = {
  end: 0.00, internal: 0.05, initial: 0.10, all: 0.00,
};

export interface NucleiScoreOptions {
  family: FamilyId;
  lang: LangCode;
  position?: RhymePositionMode;
  toneSensitive?: boolean;
}

export function scoreNuclei(
  nA: RhymeNucleus,
  nB: RhymeNucleus,
  opts: NucleiScoreOptions,
): { score: number; category: RhymeCategory } {
  const cfg = FAMILY_CONFIG[opts.family] ?? FAMILY_CONFIG['FALLBACK']!;
  const position = opts.position ?? 'end';
  const toneSensitive = opts.toneSensitive ?? true;

  if (nA.vowels === nB.vowels && nA.coda === nB.coda && nA.tone === nB.tone)
    return { score: 1.0, category: 'perfect' };

  const pedVowels = 1 - phonemeEditDistance(nA.vowels, nB.vowels);
  const pedCoda   = nA.coda === nB.coda ? 1.0 : 1 - phonemeEditDistance(nA.coda, nB.coda);
  const l3 = cfg.vowelWeight * pedVowels + cfg.codaWeight * pedCoda;

  let base = l3;
  if (cfg.useEmbedding && cfg.embeddingBlend > 0 && nA.vowels && nB.vowels) {
    const l4 = embeddingScore(nA.vowels, nB.vowels);
    base = (1 - cfg.embeddingBlend) * l3 + cfg.embeddingBlend * l4;
  }

  let score = base;
  if (toneSensitive && cfg.tonePenaltyFactor > 0) {
    const tonePenalty = getTonePenalty(nA.tone, nB.tone, opts.family, opts.lang);
    score *= 1 - cfg.tonePenaltyFactor * tonePenalty;
  }

  const adjusted = Math.max(0, score - POSITION_THRESHOLD_ADJUST[position]);
  return { score: adjusted, category: categorise(adjusted) };
}

// ─── Tone similarity (used by KWA/CRV/VIET/YRB/TAI scorers) ──────────────────

/**
 * Tone similarity in [0, 1] (1 = identical, 0 = maximally distant).
 * Despite the name, returns a SIMILARITY (kept for API compatibility with callers).
 *
 *   H/M/L  → discrete level distance: sim = 1 - |Δlevel|/2
 *   F      → falling, treated as "halfway" → 0.5 against any other level
 *   case-insensitive; either side undefined → 0.4 (no-info baseline)
 */
export function toneDistance(a?: string, b?: string): number {
  if (a === undefined || b === undefined) return 0.4;
  const A = a.toUpperCase();
  const B = b.toUpperCase();
  if (A === B) return 1;
  if (A === 'F' || B === 'F') return 0.5;
  const LEVEL: Record<string, number> = { H: 2, M: 1, L: 0 };
  const la = LEVEL[A];
  const lb = LEVEL[B];
  if (la === undefined || lb === undefined) return 0.4;
  return 1 - Math.abs(la - lb) / 2;
}

// ─── Family scorers exposed to engine.ts ─────────────────────────────────────

/** Minimal nucleus shape consumed by family scorers (allows test literals
 *  that omit `onset`). Compatible with the full RhymeNucleus interface. */
interface ScorableNucleus {
  vowels: string;
  coda: string;
  tone?: string;
  moraCount?: number;
}

/**
 * KWA-family normalized score in [0, 1].
 * Weights mirror FAMILY_CONFIG.KWA: vowel 0.45, coda 0.20, tone 0.35.
 * Identical nuclei → 1.
 */
export function scoreKWANormalized(a: ScorableNucleus, b: ScorableNucleus): number {
  if (a.vowels === b.vowels && a.coda === b.coda && (a.tone ?? '') === (b.tone ?? ''))
    return 1;
  const vSim = a.vowels === b.vowels ? 1 : 1 - phonemeEditDistance(a.vowels, b.vowels);
  const cSim = a.coda   === b.coda   ? 1 : 1 - phonemeEditDistance(a.coda,   b.coda);
  const tSim = toneDistance(a.tone || undefined, b.tone || undefined);
  const score = 0.45 * vSim + 0.20 * cSim + 0.35 * tSim;
  return Math.max(0, Math.min(1, score));
}

/**
 * CRV-family score in [0, 1].
 * Atonal default (vowel 0.60 + coda 0.40); 'ha' (Haoussa) enables tonal weighting
 * (vowel 0.45 + coda 0.20 + tone 0.35). Adds a small mora bonus when both nuclei
 * carry moraCount=2 (long vowels). Result is capped to 1.
 */
export function scoreCRV(
  a: ScorableNucleus,
  b: ScorableNucleus,
  lang?: LangCode | string,
): number {
  const vSim = a.vowels === b.vowels ? 1 : 1 - phonemeEditDistance(a.vowels, b.vowels);
  const cSim = a.coda   === b.coda   ? 1 : 1 - phonemeEditDistance(a.coda,   b.coda);
  let base: number;
  if (lang === 'ha') {
    const tSim = toneDistance(a.tone || undefined, b.tone || undefined);
    base = 0.45 * vSim + 0.20 * cSim + 0.35 * tSim;
  } else {
    base = 0.60 * vSim + 0.40 * cSim;
  }
  const moraBonus = (a.moraCount === 2 && b.moraCount === 2) ? 0.05 : 0;
  return Math.max(0, Math.min(1, base + moraBonus));
}

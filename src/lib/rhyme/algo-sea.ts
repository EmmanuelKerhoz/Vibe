/**
 * Rhyme Engine v2 — SEA wrapper (re-exports only)
 * Dedicated logic lives in:
 *   algo-tai.ts  (TH, LO)  → family TAI
 *   algo-viet.ts (VI, KM)  → family VIET
 *   algo-cjk.ts  (ZH, JA, KO) → family CJK
 *
 * This file is kept for backward-compatibility only.
 * Prefer importing directly from the dedicated modules.
 */

export { extractNucleusTAI as extractNucleusSEA, scoreTAI as scoreSEA } from './algo-tai';
export { extractNucleusCJK, scoreCJK } from './algo-cjk';

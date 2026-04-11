/**
 * Rhyme Engine v2 — AGG Family (thin wrapper)
 * Dedicated logic lives in:
 *   algo-trk.ts  (TR — Turkish)
 *   algo-fin.ts  (FI — Finnish, HU — Hungarian)
 *
 * This file is kept for backward compatibility and cross-family fallback.
 * Direct imports from algo-trk / algo-fin are preferred.
 */

export type { TRKNucleus as AGGNucleus } from './algo-trk';
export { extractNucleusTRK as extractNucleusAGG, scoreTRK as scoreAGG } from './algo-trk';

/**
 * Linguistics engine — public barrel export.
 *
 * Import from `lib/linguistics` to access the Registry and all strategies.
 */

export { PhonologicalRegistry, categorizeScore } from './core';
export type {
  Syllable,
  RhymeNucleus,
  RhymeResult,
  RhymePairResult,
  RhymeType,
  SimilarityMethod,
  MatchingWeights,
  ToneClass,
  SyllableWeight,
  TargetSchema,
  DetectedSchema,
} from './core';

export { RomanceStrategy, GermanicStrategy, KwaStrategy, CrvStrategy, SlavicStrategy, BantuStrategy, SemiticStrategy, SiniticStrategy, TaiStrategy, VietStrategy } from './strategies';
export { exactMatch, phonemeEditDistance, featureWeightedScore } from './scoring';

// ─── Bootstrap: register all built-in strategies ────────────────────────────────
import { PhonologicalRegistry } from './core';
import { RomanceStrategy, GermanicStrategy, KwaStrategy, CrvStrategy, SlavicStrategy, BantuStrategy, SemiticStrategy, SiniticStrategy, TaiStrategy, VietStrategy } from './strategies';

PhonologicalRegistry.register('ALGO-ROM', new RomanceStrategy());
PhonologicalRegistry.register('ALGO-GER', new GermanicStrategy());
PhonologicalRegistry.register('ALGO-KWA', new KwaStrategy());
PhonologicalRegistry.register('ALGO-CRV', new CrvStrategy());
PhonologicalRegistry.register('ALGO-SLV', new SlavicStrategy());
PhonologicalRegistry.register('ALGO-BNT', new BantuStrategy());
PhonologicalRegistry.register('ALGO-SEM', new SemiticStrategy());
PhonologicalRegistry.register('ALGO-SIN', new SiniticStrategy());
PhonologicalRegistry.register('ALGO-TAI', new TaiStrategy());
PhonologicalRegistry.register('ALGO-VIET', new VietStrategy());

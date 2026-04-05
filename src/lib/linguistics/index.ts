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

export { RomanceStrategy, GermanicStrategy, KwaStrategy, CrvStrategy, SlavicStrategy, BantuStrategy, SemiticStrategy, SiniticStrategy, TaiStrategy, VietStrategy, TurkicStrategy, UralicStrategy, DravidianStrategy, IndoIranianStrategy, JapaneseStrategy, KoreanStrategy, AustronesianStrategy, CreoleStrategy, FallbackStrategy } from './strategies';
export { exactMatch, phonemeEditDistance, featureWeightedScore } from './scoring';

// ─── Bootstrap: register all built-in strategies ────────────────────────────────────────────────
import { PhonologicalRegistry } from './core';
import { RomanceStrategy, GermanicStrategy, KwaStrategy, CrvStrategy, SlavicStrategy, BantuStrategy, SemiticStrategy, SiniticStrategy, TaiStrategy, VietStrategy, TurkicStrategy, UralicStrategy, DravidianStrategy, IndoIranianStrategy, JapaneseStrategy, KoreanStrategy, AustronesianStrategy, CreoleStrategy, FallbackStrategy } from './strategies';

PhonologicalRegistry.register('ALGO-ROM',  new RomanceStrategy());
PhonologicalRegistry.register('ALGO-GER',  new GermanicStrategy());
PhonologicalRegistry.register('ALGO-KWA',  new KwaStrategy());
PhonologicalRegistry.register('ALGO-CRV',  new CrvStrategy());
PhonologicalRegistry.register('ALGO-SLV',  new SlavicStrategy());
PhonologicalRegistry.register('ALGO-BNT',  new BantuStrategy());
PhonologicalRegistry.register('ALGO-SEM',  new SemiticStrategy());
PhonologicalRegistry.register('ALGO-SIN',  new SiniticStrategy());
PhonologicalRegistry.register('ALGO-TAI',  new TaiStrategy());
PhonologicalRegistry.register('ALGO-VIET', new VietStrategy());
PhonologicalRegistry.register('ALGO-TRK',  new TurkicStrategy());
PhonologicalRegistry.register('ALGO-FIN',  new UralicStrategy());
PhonologicalRegistry.register('ALGO-DRV',  new DravidianStrategy());
PhonologicalRegistry.register('ALGO-IIR',  new IndoIranianStrategy());
PhonologicalRegistry.register('ALGO-JAP',  new JapaneseStrategy());
PhonologicalRegistry.register('ALGO-KOR',  new KoreanStrategy());
PhonologicalRegistry.register('ALGO-AUS',  new AustronesianStrategy());
PhonologicalRegistry.register('ALGO-CRE',  new CreoleStrategy());
// ALGO-ROBUST must be last: Registry captures it as this.fallback
PhonologicalRegistry.register('ALGO-ROBUST', new FallbackStrategy());

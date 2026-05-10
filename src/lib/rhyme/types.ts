/**
 * Rhyme Engine v3 — Core Types
 */

export type LangCode =
  | 'fr' | 'es' | 'it' | 'pt' | 'ro' | 'ca'
  | 'en' | 'de' | 'nl' | 'sv' | 'da' | 'no' | 'is'
  | 'ar' | 'he' | 'am' | 'ha'
  | 'zh' | 'yue' | 'ja' | 'ko'
  | 'th' | 'lo'
  | 'vi' | 'km'
  | 'sw' | 'lg' | 'rw' | 'sn' | 'zu' | 'xh' | 'ny' | 'bm' | 'ff'
  | 'yo'
  | 'ba' | 'di' | 'ew' | 'mi'
  | 'bk' | 'cb' | 'og'
  | 'ru' | 'pl' | 'cs' | 'sk' | 'uk' | 'bg' | 'sr' | 'hr'
  | 'tr' | 'az' | 'uz' | 'kk'
  | 'fi' | 'hu' | 'et'
  | 'hi' | 'sa' | 'ur' | 'bn' | 'fa' | 'pa'
  | 'id' | 'ms' | 'tl' | 'mg' | 'jv'
  | 'ta' | 'te' | 'kn' | 'ml'
  | 'nou' | 'pcm' | 'cfg'
  | '__unknown__';

export type FamilyId =
  | 'KWA' | 'CRV' | 'ROM' | 'GER' | 'BNT' | 'YRB' | 'SLV' | 'SEM'
  | 'TAI' | 'VIET' | 'CJK' | 'TRK' | 'FIN' | 'IIR' | 'AUS' | 'DRA'
  | 'CRE' | 'FALLBACK';

export type SegmentationMode =
  | 'whitespace' | 'character' | 'rtl' | 'tonal-syllable'
  | 'tone-mark' | 'morpheme' | 'unknown';

export type ScriptClass =
  | 'latin' | 'arabic' | 'hebrew' | 'cjk' | 'thai' | 'khmer'
  | 'cyrillic' | 'devanagari' | 'other';

/** Position where the rhyme is searched within lines */
export type RhymePosition = 'end' | 'internal' | 'initial' | 'all';

export interface LineEndingUnit {
  surface: string;
  normalized: string;
  script: ScriptClass;
  segmentationMode: SegmentationMode;
  warnings: string[];
}

export interface RhymeNucleus {
  vowels: string;
  coda: string;
  tone: string;
  onset: string;
  moraCount: number;
  /**
   * Start index (inclusive) of the rhyming nucleus within the original
   * LineEndingUnit.surface string.  Used by the UI to highlight exactly
   * the rhyming portion without any heuristic re-computation.
   * -1 when the span could not be determined.
   * Optional: non-ROM algos may omit this field until charSpan is propagated.
   */
  charSpanStart?: number;
  /**
   * End index (exclusive) of the rhyming nucleus within the original
   * LineEndingUnit.surface string.
   * -1 when the span could not be determined.
   * Optional: non-ROM algos may omit this field until charSpan is propagated.
   */
  charSpanEnd?: number;
}

export interface RhymeResult {
  score: number;
  category: RhymeCategory;
  family: FamilyId;
  langA: LangCode;
  langB: LangCode;
  unitA: LineEndingUnit;
  unitB: LineEndingUnit;
  nucleusA: RhymeNucleus;
  nucleusB: RhymeNucleus;
  lowResourceFallback: boolean;
  warnings: string[];
  /** Position mode used for this result (default: 'end') */
  position?: RhymePosition;
  /** True when code-switching was detected and cross-lang scoring was applied */
  csDetected?: boolean;
}

export type RhymeCategory =
  | 'perfect' | 'rich' | 'sufficient' | 'weak' | 'none';

export type SchemeLabel =
  | 'AABB' | 'ABAB' | 'ABBA' | 'ABCABC' | 'TERZA_RIMA'
  | 'MONORHYME' | 'FREE_VERSE' | 'CUSTOM';

export interface SchemeResult {
  letters: string[];
  label: SchemeLabel;
  confidence: number;
  pairScores: Array<{ i: number; j: number; result: RhymeResult }>;
  warnings: string[];
  isProxied: boolean;
}

/** Result of a full block (multi-line text) analysis */
export interface BlockAnalysisResult {
  /** Cleaned verse lines extracted from the block */
  lines: string[];
  /** End-of-line rhyme scheme */
  scheme: SchemeResult;
  /** Internal / initial rhymes when position !== 'end' */
  positionRhymes?: Array<{
    lineIndex: number;
    tokenPairs: Array<{ tokenA: string; tokenB: string; result: RhymeResult }>;
  }>;
  /** Code-switching detection warnings per line, format: "lineN:cs:lang@tokenIdx" */
  csWarnings: string[];
}

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
}

/**
 * Character span of the rhyming portion within the original line.
 * Both indices are on the NFC-normalised line string, 0-based, end exclusive.
 * The UI must underline line.slice(start, end).
 */
export interface RhymeCharSpan {
  /** Inclusive start index in the original (NFC-normalised) line */
  start: number;
  /** Exclusive end index — underline line.slice(start, end) */
  end: number;
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
  /**
   * Character span of the rhyming portion in lineA / lineB respectively.
   * Indices are on the NFC-normalised line, end-exclusive.
   * Absent when the surface token could not be located (e.g. FALLBACK family).
   */
  charSpanA?: RhymeCharSpan;
  charSpanB?: RhymeCharSpan;
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

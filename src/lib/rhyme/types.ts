/**
 * Rhyme Engine v2 — Core Types
 */

export type LangCode =
  | 'fr' | 'es' | 'it' | 'pt'           // Romance
  | 'en' | 'de' | 'nl'                   // Germanic
  | 'ar' | 'he'                           // Semitic
  | 'zh' | 'ja' | 'ko'                   // CJK
  | 'th' | 'vi' | 'km'                   // Southeast Asia
  | 'sw' | 'yo'                           // Bantu/Niger-Congo
  | 'ba' | 'di' | 'ew' | 'mi'           // KWA
  | 'bk' | 'cb' | 'og' | 'ha'           // CRV
  | 'ru' | 'pl' | 'cs'                   // Slavic
  | 'tr' | 'fi' | 'hu'                   // Agglutinative
  | '__unknown__';

export type FamilyId = 'KWA' | 'CRV' | 'ROM' | 'GER' | 'BNT' | 'FALLBACK';

export type SegmentationMode =
  | 'whitespace'      // standard space-delimited
  | 'character'       // CJK, no spaces
  | 'rtl'             // Arabic, Hebrew
  | 'tonal-syllable'  // Thai, Khmer
  | 'tone-mark'       // Vietnamese, KWA
  | 'morpheme'        // Agglutinative fallback
  | 'unknown';

export type ScriptClass =
  | 'latin' | 'arabic' | 'hebrew' | 'cjk' | 'thai' | 'khmer'
  | 'cyrillic' | 'devanagari' | 'other';

/**
 * Output of extractLineEndingUnit — the structured replacement for extractLineTail.
 * Feeds directly into G2P then RhymeNucleus computation.
 */
export interface LineEndingUnit {
  /** Raw surface form as found in the line */
  surface: string;
  /** NFC-normalized, diacritic-safe form (tones preserved) */
  normalized: string;
  /** Detected script class */
  script: ScriptClass;
  /** Segmentation strategy applied */
  segmentationMode: SegmentationMode;
  /** Non-fatal extraction warnings */
  warnings: string[];
}

/**
 * IPA-level nucleus after G2P processing.
 */
export interface RhymeNucleus {
  /** Vowel nucleus (IPA string) */
  vowels: string;
  /** Coda consonants (IPA string, may be empty) */
  coda: string;
  /** Tone class for tonal languages: H / M / L / R / F or '' */
  tone: string;
  /** Onset consonants kept for identity check only */
  onset: string;
  /** Mora count (1 or 2 for long vowels) */
  moraCount: number;
}

/**
 * Final rhyme comparison result.
 */
export interface RhymeResult {
  score: number;           // 0–1 continuous
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
}

export type RhymeCategory =
  | 'perfect'       // score ≥ 0.92
  | 'rich'          // score ≥ 0.80
  | 'sufficient'    // score ≥ 0.60
  | 'weak'          // score ≥ 0.35
  | 'none';         // score < 0.35

// ─── Scheme detection types ───────────────────────────────────────────────────
// Defined here so all consumers (useRhymeScheme, SectionLineList, SectionFooter)
// can import from a single canonical location without a circular dependency on
// rhymeSchemeDetector.ts.

export type SchemeLabel =
  | 'AABB'         // couplets
  | 'ABAB'         // alternate
  | 'ABBA'         // embrace / petrarchan quatrain
  | 'ABCABC'       // sestain
  | 'TERZA_RIMA'   // ABA BCB CDC …
  | 'MONORHYME'    // AAAA…
  | 'FREE_VERSE'   // no detectable pattern
  | 'CUSTOM';      // other detected pattern

export interface SchemeResult {
  /** Per-line letter assignment, e.g. ['A','B','A','B'] */
  letters: string[];
  /** Detected scheme label */
  label: SchemeLabel;
  /** Confidence 0–1: fraction of expected rhyme pairs that score ≥ threshold */
  confidence: number;
  /** All pairwise scores (i,j) where j > i, for debugging */
  pairScores: Array<{ i: number; j: number; result: RhymeResult }>;
  /** Warnings from underlying rhymeScore calls */
  warnings: string[];
}

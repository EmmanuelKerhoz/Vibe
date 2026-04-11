/**
 * Rhyme Engine v2 — Core Types
 */

export type LangCode =
  | 'fr' | 'es' | 'it' | 'pt'           // Romance
  | 'en' | 'de' | 'nl'                   // Germanic
  | 'ar' | 'he'                           // Semitic
  | 'zh' | 'ja' | 'ko'                   // CJK
  | 'th' | 'lo'                           // TAI (Thai, Lao)
  | 'vi' | 'km'                           // VIET (Vietnamese, Khmer)
  | 'sw' | 'lg' | 'rw' | 'sn' | 'zu' | 'xh' | 'ny'  // Bantu
  | 'yo'                                  // Yoruboid
  | 'ba' | 'di' | 'ew' | 'mi'           // KWA
  | 'bk' | 'cb' | 'og' | 'ha'           // CRV
  | 'ru' | 'pl' | 'cs'                   // Slavic
  | 'tr'                                  // TRK (Turkish)
  | 'fi' | 'hu'                           // FIN (Finnish, Hungarian)
  | 'hi' | 'ur' | 'bn' | 'fa' | 'pa'   // Indo-Iranian
  | 'id' | 'ms' | 'tl' | 'mg'           // Austronesian
  | 'ta' | 'te' | 'kn' | 'ml'           // Dravidian
  | '__unknown__';

export type FamilyId =
  | 'KWA'      // Kwa (Akan, Ewe, Mina…)
  | 'CRV'      // Crioulo / Volta-Congo residual
  | 'ROM'      // Romance
  | 'GER'      // Germanic
  | 'BNT'      // Bantu
  | 'YRB'      // Yoruboid
  | 'SLV'      // Slavic
  | 'SEM'      // Semitic
  | 'TAI'      // Tai-Kadai tonal (Thai, Lao)
  | 'VIET'     // Vietic + Khmer (Vietnamese, Khmer)
  | 'CJK'      // Chinese-Japanese-Korean
  | 'TRK'      // Turkic (Turkish)
  | 'FIN'      // Finno-Ugric (Finnish, Hungarian)
  | 'IIR'      // Indo-Iranian (Hindi, Urdu, Bengali, Persian, Punjabi)
  | 'AUS'      // Austronesian (Indonesian, Malay, Tagalog, Malagasy)
  | 'DRA'      // Dravidian (Tamil, Telugu, Kannada, Malayalam)
  | 'FALLBACK';

export type SegmentationMode =
  | 'whitespace'
  | 'character'
  | 'rtl'
  | 'tonal-syllable'
  | 'tone-mark'
  | 'morpheme'
  | 'unknown';

export type ScriptClass =
  | 'latin' | 'arabic' | 'hebrew' | 'cjk' | 'thai' | 'khmer'
  | 'cyrillic' | 'devanagari' | 'other';

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
}

export type RhymeCategory =
  | 'perfect'
  | 'rich'
  | 'sufficient'
  | 'weak'
  | 'none';

export type SchemeLabel =
  | 'AABB'
  | 'ABAB'
  | 'ABBA'
  | 'ABCABC'
  | 'TERZA_RIMA'
  | 'MONORHYME'
  | 'FREE_VERSE'
  | 'CUSTOM';

export interface SchemeResult {
  letters: string[];
  label: SchemeLabel;
  confidence: number;
  pairScores: Array<{ i: number; j: number; result: RhymeResult }>;
  warnings: string[];
  isProxied?: boolean;
}

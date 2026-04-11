/**
 * Rhyme Engine v2 — Core Types
 */

export type LangCode =
  | 'fr' | 'es' | 'it' | 'pt' | 'ro' | 'ca'  // Romance
  | 'en' | 'de' | 'nl' | 'sv' | 'da' | 'no' | 'is'  // Germanic
  | 'ar' | 'he' | 'am' | 'ha'                  // Semitic + Chadic (Afro-Asiatic)
  | 'zh' | 'yue' | 'ja' | 'ko'                  // CJK
  | 'th' | 'lo'                                  // TAI (Thai, Lao)
  | 'vi' | 'km'                                  // VIET (Vietnamese, Khmer)
  | 'sw' | 'lg' | 'rw' | 'sn' | 'zu' | 'xh' | 'ny' | 'bm' | 'ff'  // Bantu
  | 'yo'                                         // Yoruboid
  | 'ba' | 'di' | 'ew' | 'mi'                   // KWA
  | 'bk' | 'cb' | 'og'                          // CRV
  | 'ru' | 'pl' | 'cs' | 'sk' | 'uk' | 'bg' | 'sr' | 'hr'  // Slavic
  | 'tr' | 'az' | 'uz' | 'kk'                   // TRK (Turkic)
  | 'fi' | 'hu' | 'et'                           // FIN (Finno-Ugric)
  | 'hi' | 'ur' | 'bn' | 'fa' | 'pa'            // Indo-Iranian
  | 'id' | 'ms' | 'tl' | 'mg' | 'jv'            // Austronesian
  | 'ta' | 'te' | 'kn' | 'ml'                   // Dravidian
  | 'nou' | 'pcm' | 'cfg'                        // Creole / Pidgin
  | '__unknown__';

export type FamilyId =
  | 'KWA'      // Kwa (Akan, Ewe, Mina…)
  | 'CRV'      // Crioulo / Volta-Congo residual
  | 'ROM'      // Romance
  | 'GER'      // Germanic
  | 'BNT'      // Bantu
  | 'YRB'      // Yoruboid
  | 'SLV'      // Slavic
  | 'SEM'      // Semitic + Chadic (Afro-Asiatic)
  | 'TAI'      // Tai-Kadai tonal (Thai, Lao)
  | 'VIET'     // Vietic + Khmer (Vietnamese, Khmer)
  | 'CJK'      // Chinese-Japanese-Korean
  | 'TRK'      // Turkic
  | 'FIN'      // Finno-Ugric (Finnish, Hungarian, Estonian)
  | 'IIR'      // Indo-Iranian (Hindi, Urdu, Bengali, Persian, Punjabi)
  | 'AUS'      // Austronesian (Indonesian, Malay, Tagalog, Malagasy, Javanese)
  | 'DRA'      // Dravidian (Tamil, Telugu, Kannada, Malayalam)
  | 'CRE'      // Creole / Pidgin
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
  isProxied: boolean;
}

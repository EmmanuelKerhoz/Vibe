/**
 * Language family mapping for phonemic engine
 * Based on docs_fusion_optimal.md specification
 * Maps ISO 639-1/639-3 language codes to algorithm families (ALGO-XXX)
 */

export type AlgoFamily =
  | 'ALGO-ROM'   // Romance languages
  | 'ALGO-GER'   // Germanic languages
  | 'ALGO-SLV'   // Slavic languages
  | 'ALGO-SEM'   // Semitic languages
  | 'ALGO-SIN'   // Sinitic languages
  | 'ALGO-JAP'   // Japanese
  | 'ALGO-KOR'   // Korean
  | 'ALGO-BNT'   // Bantu / Niger-Congo generic
  | 'ALGO-KWA'   // Niger-Congo Kwa
  | 'ALGO-CRV'   // Cross River / Chadic
  | 'ALGO-IIR'   // Indo-Iranian
  | 'ALGO-DRV'   // Dravidian
  | 'ALGO-TRK'   // Turkic
  | 'ALGO-FIN'   // Uralic
  | 'ALGO-TAI'   // Tai-Kadai
  | 'ALGO-VIET'  // Austroasiatic
  | 'ALGO-AUS';  // Austronesian

export interface LanguageFamilyConfig {
  family: AlgoFamily;
  label: string;
  hasTones: boolean;
  hasVowelHarmony: boolean;
  syllableStructure: 'CV' | 'CVC' | 'CVCC' | 'complex';
  codaRelevance: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Map language codes to their algorithm family
 * ISO 639-1 codes preferred, ISO 639-3 for specific African languages
 */
export const LANG_TO_FAMILY: Record<string, AlgoFamily> = {
  // Romance (ALGO-ROM)
  'fr': 'ALGO-ROM',
  'es': 'ALGO-ROM',
  'it': 'ALGO-ROM',
  'pt': 'ALGO-ROM',
  'ro': 'ALGO-ROM',
  'ca': 'ALGO-ROM',

  // Germanic (ALGO-GER)
  'en': 'ALGO-GER',
  'de': 'ALGO-GER',
  'nl': 'ALGO-GER',
  'sv': 'ALGO-GER',
  'da': 'ALGO-GER',
  'no': 'ALGO-GER',
  'is': 'ALGO-GER',

  // Slavic (ALGO-SLV)
  'ru': 'ALGO-SLV',
  'pl': 'ALGO-SLV',
  'cs': 'ALGO-SLV',
  'sk': 'ALGO-SLV',
  'uk': 'ALGO-SLV',
  'bg': 'ALGO-SLV',
  'sr': 'ALGO-SLV',
  'hr': 'ALGO-SLV',

  // Semitic (ALGO-SEM)
  'ar': 'ALGO-SEM',
  'he': 'ALGO-SEM',
  'am': 'ALGO-SEM',

  // Sinitic (ALGO-SIN)
  'zh': 'ALGO-SIN',
  'yue': 'ALGO-SIN',
  'wuu': 'ALGO-SIN',

  // Japanese (ALGO-JAP)
  'ja': 'ALGO-JAP',

  // Korean (ALGO-KOR)
  'ko': 'ALGO-KOR',

  // Bantu / Niger-Congo (ALGO-BNT)
  'sw': 'ALGO-BNT',
  'yo': 'ALGO-BNT',
  'zu': 'ALGO-BNT',
  'xh': 'ALGO-BNT',

  // Kwa (ALGO-KWA)
  'bci': 'ALGO-KWA',  // Baoulé
  'dyu': 'ALGO-KWA',  // Dioula
  'ee': 'ALGO-KWA',   // Ewe
  'gej': 'ALGO-KWA',  // Mina

  // Cross River / Chadic (ALGO-CRV)
  'bkv': 'ALGO-CRV',  // Bekwarra
  'ijn': 'ALGO-CRV',  // Calabari (Kalabari)
  'iko': 'ALGO-CRV',  // Ogoja (approximation)
  'ha': 'ALGO-CRV',   // Hausa

  // Indo-Iranian (ALGO-IIR)
  'hi': 'ALGO-IIR',
  'ur': 'ALGO-IIR',
  'bn': 'ALGO-IIR',
  'pa': 'ALGO-IIR',
  'fa': 'ALGO-IIR',

  // Dravidian (ALGO-DRV)
  'ta': 'ALGO-DRV',
  'te': 'ALGO-DRV',
  'kn': 'ALGO-DRV',
  'ml': 'ALGO-DRV',

  // Turkic (ALGO-TRK)
  'tr': 'ALGO-TRK',
  'uz': 'ALGO-TRK',
  'kk': 'ALGO-TRK',
  'az': 'ALGO-TRK',

  // Uralic (ALGO-FIN)
  'fi': 'ALGO-FIN',
  'et': 'ALGO-FIN',
  'hu': 'ALGO-FIN',

  // Tai-Kadai (ALGO-TAI)
  'th': 'ALGO-TAI',
  'lo': 'ALGO-TAI',

  // Austroasiatic (ALGO-VIET)
  'vi': 'ALGO-VIET',
  'km': 'ALGO-VIET',

  // Austronesian (ALGO-AUS)
  'id': 'ALGO-AUS',
  'ms': 'ALGO-AUS',
  'tl': 'ALGO-AUS',
  'jv': 'ALGO-AUS',
};

/**
 * Configuration for each language family
 */
export const FAMILY_CONFIG: Record<AlgoFamily, LanguageFamilyConfig> = {
  'ALGO-ROM': {
    family: 'ALGO-ROM',
    label: 'Romance',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-GER': {
    family: 'ALGO-GER',
    label: 'Germanic',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CVCC',
    codaRelevance: 'high',
  },
  'ALGO-SLV': {
    family: 'ALGO-SLV',
    label: 'Slavic',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CVCC',
    codaRelevance: 'high',
  },
  'ALGO-SEM': {
    family: 'ALGO-SEM',
    label: 'Semitic',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-SIN': {
    family: 'ALGO-SIN',
    label: 'Sinitic',
    hasTones: true,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-JAP': {
    family: 'ALGO-JAP',
    label: 'Japanese',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CV',
    codaRelevance: 'low',
  },
  'ALGO-KOR': {
    family: 'ALGO-KOR',
    label: 'Korean',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'high',
  },
  'ALGO-BNT': {
    family: 'ALGO-BNT',
    label: 'Bantu',
    hasTones: true,
    hasVowelHarmony: true,
    syllableStructure: 'CV',
    codaRelevance: 'medium',
  },
  'ALGO-KWA': {
    family: 'ALGO-KWA',
    label: 'Kwa (Niger-Congo)',
    hasTones: true,
    hasVowelHarmony: true,
    syllableStructure: 'CV',
    codaRelevance: 'none',
  },
  'ALGO-CRV': {
    family: 'ALGO-CRV',
    label: 'Cross River / Chadic',
    hasTones: true,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-IIR': {
    family: 'ALGO-IIR',
    label: 'Indo-Iranian',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-DRV': {
    family: 'ALGO-DRV',
    label: 'Dravidian',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-TRK': {
    family: 'ALGO-TRK',
    label: 'Turkic',
    hasTones: false,
    hasVowelHarmony: true,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-FIN': {
    family: 'ALGO-FIN',
    label: 'Uralic',
    hasTones: false,
    hasVowelHarmony: true,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-TAI': {
    family: 'ALGO-TAI',
    label: 'Tai-Kadai',
    hasTones: true,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'medium',
  },
  'ALGO-VIET': {
    family: 'ALGO-VIET',
    label: 'Austroasiatic',
    hasTones: true,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'high',
  },
  'ALGO-AUS': {
    family: 'ALGO-AUS',
    label: 'Austronesian',
    hasTones: false,
    hasVowelHarmony: false,
    syllableStructure: 'CVC',
    codaRelevance: 'low',
  },
};

/**
 * Get algorithm family for a language code
 * Returns undefined if language is not mapped
 */
export const getAlgoFamily = (langCode: string): AlgoFamily | undefined => {
  return LANG_TO_FAMILY[langCode.toLowerCase()];
};

/**
 * Get configuration for a language code
 * Returns undefined if language is not mapped
 */
export const getFamilyConfig = (langCode: string): LanguageFamilyConfig | undefined => {
  const family = getAlgoFamily(langCode);
  return family ? FAMILY_CONFIG[family] : undefined;
};

/**
 * Check if a language code belongs to a tonal language family
 */
export const isTonalLanguage = (langCode: string): boolean => {
  const config = getFamilyConfig(langCode);
  return config?.hasTones ?? false;
};

/**
 * Tonal diacritics that should be preserved for tonal languages
 * Unicode combining diacriticals for tone marking
 */
export const TONE_DIACRITICS = [
  '\u0300', // Combining grave accent (low tone)
  '\u0301', // Combining acute accent (high tone)
  '\u0302', // Combining circumflex (falling tone)
  '\u0303', // Combining tilde (mid tone)
  '\u0304', // Combining macron (level tone)
  '\u030C', // Combining caron (rising tone)
];

/**
 * Get tone diacritics regex pattern for stripping
 * Returns pattern that excludes tonal diacritics if language is tonal
 */
export const getTonalDiacriticsPattern = (langCode?: string): RegExp => {
  if (!langCode || !isTonalLanguage(langCode)) {
    // Strip all diacritics for non-tonal languages
    return /[\u0300-\u036f]/g;
  }

  // For tonal languages, preserve tone diacritics (grave, acute, circumflex, tilde, macron, caron)
  // Strip only non-tonal diacritics: breve, ring, cedilla, ogonek, dot, etc.
  // Exclude: \u0300 (grave), \u0301 (acute), \u0302 (circumflex), \u0303 (tilde), \u0304 (macron), \u030C (caron)
  return /[\u0305-\u030B\u030D-\u036f]/g;
};

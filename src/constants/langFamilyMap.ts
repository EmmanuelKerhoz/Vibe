/**
 * Language family mapping for phonemic engine
 * Based on docs_fusion_optimal.md specification
 * Updated to include visual metadata (flags) for Lyricist Pro UI
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
  | 'ALGO-AUS'   // Austronesian
  | 'ALGO-CRE'   // Creole / Pidgin
  | 'ALGO-ROBUST'; // Universal fallback

export interface LanguageFamilyConfig {
  family: AlgoFamily;
  label: string;
  flag: string; // Restored for UI rendering
  hasTones: boolean;
  hasVowelHarmony: boolean;
  syllableStructure: 'CV' | 'CVC' | 'CVCC' | 'complex';
  codaRelevance: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Flag mapping for specific ISO codes
 * Used to recover the visual identity of the language dropdowns
 */
export const LANGUAGE_FLAGS: Record<string, string> = {
  'fr': '🇫🇷', 'es': '🇪🇸', 'it': '🇮🇹', 'pt': '🇵🇹', 'ro': '🇷🇴', 'ca': '🇦🇩',
  'en': '🇬🇧', 'de': '🇩🇪', 'nl': '🇳🇱', 'sv': '🇸🇪', 'da': '🇩🇰', 'no': '🇳🇴', 'is': '🇮🇸',
  'ru': '🇷🇺', 'pl': '🇵🇱', 'cs': '🇨🇿', 'sk': '🇸🇰', 'uk': '🇺🇦', 'bg': '🇧🇬', 'sr': '🇷🇸', 'hr': '🇭🇷',
  'dyu': '🇨🇮', 'bci': '🇨🇮', 'ee': '🇹🇬', 'gej': '🇹🇬', 'sw': '🇰🇪', 'yo': '🇳🇬', 'zu': '🇿🇦', 'xh': '🇿🇦', 'ha': '🇳🇬',
  'zh': '🇨🇳', 'yue': '🇭🇰', 'ja': '🇯🇵', 'ko': '🇰🇷', 'hi': '🇮🇳', 'th': '🇹🇭', 'vi': '🇻🇳',
  'ar': '🇸🇦', 'he': '🇮🇱', 'tr': '🇹🇷', 'id': '🇮🇩',
  'nou': '🇨🇮', 'pcm': '🇳🇬', 'cfg': '🇨🇲',
};

export const LANG_TO_FAMILY: Record<string, AlgoFamily> = {
  'fr': 'ALGO-ROM', 'es': 'ALGO-ROM', 'it': 'ALGO-ROM', 'pt': 'ALGO-ROM', 'ro': 'ALGO-ROM', 'ca': 'ALGO-ROM',
  'en': 'ALGO-GER', 'de': 'ALGO-GER', 'nl': 'ALGO-GER', 'sv': 'ALGO-GER', 'da': 'ALGO-GER', 'no': 'ALGO-GER', 'is': 'ALGO-GER',
  'ru': 'ALGO-SLV', 'pl': 'ALGO-SLV', 'cs': 'ALGO-SLV', 'sk': 'ALGO-SLV', 'uk': 'ALGO-SLV', 'bg': 'ALGO-SLV', 'sr': 'ALGO-SLV', 'hr': 'ALGO-SLV',
  'ar': 'ALGO-SEM', 'he': 'ALGO-SEM', 'am': 'ALGO-SEM',
  'zh': 'ALGO-SIN', 'yue': 'ALGO-SIN', 'wuu': 'ALGO-SIN',
  'ja': 'ALGO-JAP', 'ko': 'ALGO-KOR',
  'sw': 'ALGO-BNT', 'yo': 'ALGO-BNT', 'zu': 'ALGO-BNT', 'xh': 'ALGO-BNT',
  'bci': 'ALGO-KWA', 'dyu': 'ALGO-KWA', 'ee': 'ALGO-KWA', 'gej': 'ALGO-KWA',
  'bkv': 'ALGO-CRV', 'ijn': 'ALGO-CRV', 'iko': 'ALGO-CRV', 'ha': 'ALGO-CRV',
  'hi': 'ALGO-IIR', 'ur': 'ALGO-IIR', 'bn': 'ALGO-IIR', 'pa': 'ALGO-IIR', 'fa': 'ALGO-IIR',
  'ta': 'ALGO-DRV', 'te': 'ALGO-DRV', 'kn': 'ALGO-DRV', 'ml': 'ALGO-DRV',
  'tr': 'ALGO-TRK', 'uz': 'ALGO-TRK', 'kk': 'ALGO-TRK', 'az': 'ALGO-TRK',
  'fi': 'ALGO-FIN', 'et': 'ALGO-FIN', 'hu': 'ALGO-FIN',
  'th': 'ALGO-TAI', 'lo': 'ALGO-TAI',
  'vi': 'ALGO-VIET', 'km': 'ALGO-VIET',
  'id': 'ALGO-AUS', 'ms': 'ALGO-AUS', 'tl': 'ALGO-AUS', 'jv': 'ALGO-AUS',
  'nou': 'ALGO-CRE', 'pcm': 'ALGO-CRE', 'cfg': 'ALGO-CRE',
};

export const FAMILY_CONFIG: Record<AlgoFamily, LanguageFamilyConfig> = {
  'ALGO-ROM': { family: 'ALGO-ROM', label: 'Romance', flag: '🇫🇷', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-GER': { family: 'ALGO-GER', label: 'Germanic', flag: '🇬🇧', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVCC', codaRelevance: 'high' },
  'ALGO-SLV': { family: 'ALGO-SLV', label: 'Slavic', flag: '🇷🇺', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVCC', codaRelevance: 'high' },
  'ALGO-SEM': { family: 'ALGO-SEM', label: 'Semitic', flag: '🇸🇦', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-SIN': { family: 'ALGO-SIN', label: 'Sinitic', flag: '🇨🇳', hasTones: true, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-JAP': { family: 'ALGO-JAP', label: 'Japanese', flag: '🇯🇵', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CV', codaRelevance: 'low' },
  'ALGO-KOR': { family: 'ALGO-KOR', label: 'Korean', flag: '🇰🇷', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'high' },
  'ALGO-BNT': { family: 'ALGO-BNT', label: 'Bantu', flag: '🇰🇪', hasTones: true, hasVowelHarmony: true, syllableStructure: 'CV', codaRelevance: 'medium' },
  'ALGO-KWA': { family: 'ALGO-KWA', label: 'Kwa (Niger-Congo)', flag: '🇨🇮', hasTones: true, hasVowelHarmony: true, syllableStructure: 'CV', codaRelevance: 'none' },
  'ALGO-CRV': { family: 'ALGO-CRV', label: 'Cross River / Chadic', flag: '🇳🇬', hasTones: true, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-IIR': { family: 'ALGO-IIR', label: 'Indo-Iranian', flag: '🇮🇳', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-DRV': { family: 'ALGO-DRV', label: 'Dravidian', flag: '🇮🇳', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-TRK': { family: 'ALGO-TRK', label: 'Turkic', flag: '🇹🇷', hasTones: false, hasVowelHarmony: true, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-FIN': { family: 'ALGO-FIN', label: 'Uralic', flag: '🇫🇮', hasTones: false, hasVowelHarmony: true, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-TAI': { family: 'ALGO-TAI', label: 'Tai-Kadai', flag: '🇹🇭', hasTones: true, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'medium' },
  'ALGO-VIET': { family: 'ALGO-VIET', label: 'Austroasiatic', flag: '🇻🇳', hasTones: true, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'high' },
  'ALGO-AUS': { family: 'ALGO-AUS', label: 'Austronesian', flag: '🇮🇩', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC', codaRelevance: 'low' },
  'ALGO-CRE': { family: 'ALGO-CRE', label: 'Creole / Pidgin', flag: '🇨🇮', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CV', codaRelevance: 'low' },
  'ALGO-ROBUST': { family: 'ALGO-ROBUST', label: 'Unknown / Fallback', flag: '🌐', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CV', codaRelevance: 'none' },
};

export const getAlgoFamily = (langCode: string): AlgoFamily | undefined => {
  return LANG_TO_FAMILY[langCode.toLowerCase()];
};

export const getFamilyConfig = (langCode: string): LanguageFamilyConfig | undefined => {
  const family = getAlgoFamily(langCode);
  return family ? FAMILY_CONFIG[family] : undefined;
};

export const isTonalLanguage = (langCode: string): boolean => {
  const config = getFamilyConfig(langCode);
  return config?.hasTones ?? false;
};

export const TONE_DIACRITICS = [
  '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u030C',
];

export const getTonalDiacriticsPattern = (langCode?: string): RegExp => {
  if (!langCode || !isTonalLanguage(langCode)) {
    return /[\u0300-\u036f]/g;
  }
  return /[\u0305-\u030B\u030D-\u036f]/g;
};

export const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  'english': 'en', 'german': 'de', 'dutch': 'nl', 'swedish': 'sv', 'danish': 'da', 'norwegian': 'no', 'icelandic': 'is',
  'french': 'fr', 'spanish': 'es', 'italian': 'it', 'portuguese': 'pt', 'romanian': 'ro', 'catalan': 'ca',
  'russian': 'ru', 'polish': 'pl', 'czech': 'cs', 'slovak': 'sk', 'uk': 'uk', 'bulgarian': 'bg', 'serbian': 'sr', 'croatian': 'hr',
  'yoruba': 'yo', 'swahili': 'sw', 'zulu': 'zu', 'xhosa': 'xh', 'hausa': 'ha', 'baoulé': 'bci', 'baoule': 'bci', 'baule': 'bci', 'dioula': 'dyu', 'ewe': 'ee', 'mina': 'gej',
  'nouchi': 'nou', 'nigerian pidgin': 'pcm', 'pidgin': 'pcm', 'camfranglais': 'cfg',
  'chinese': 'zh', 'mandarin': 'zh', 'cantonese': 'yue', 'japanese': 'ja', 'korean': 'ko', 'hindi': 'hi', 'urdu': 'ur', 'bengali': 'bn', 'punjabi': 'pa', 'persian': 'fa', 'tamil': 'ta', 'telugu': 'te', 'kannada': 'kn', 'malayalam': 'ml', 'thai': 'th', 'vietnamese': 'vi', 'indonesian': 'id', 'malay': 'ms', 'tagalog': 'tl',
  'arabic': 'ar', 'hebrew': 'he', 'amharic': 'am', 'turkish': 'tr', 'finnish': 'fi', 'hungarian': 'hu',
};

export const languageNameToCode = (languageName: string): string | undefined => {
  if (!languageName) return undefined;
  const normalized = languageName.toLowerCase().trim();
  if (LANG_TO_FAMILY[normalized]) return normalized;
  return LANGUAGE_NAME_TO_CODE[normalized];
};

/**
 * Language family mapping for phonemic engine
 * Based on docs_fusion_optimal.md specification
 * Updated to include visual metadata (flags) for Lyricist Pro UI
 *
 * KWA short codes (ba, ew, mi, di) are aliases emitted by detectLanguage()
 * word-pilot stage. They mirror the canonical SIL codes (bci, ee, gej, dyu)
 * and route to ALGO-KWA. Both must be present so Registry.resolve() works
 * regardless of which code arrives from the call site.
 *
 * LANGUAGE_FLAGS coverage rule:
 *   - Nation-state language  → official country flag emoji
 *   - Sub-national dialect / no single nation-state → ethnic pictogram
 *     bkv 🌿  Bekwarra (Cross River, Nigeria)
 *     ijn ⚓  Ijaw (Niger Delta, Nigeria)
 *     iko 🏺  Ogoja (Cross River, Nigeria)
 *     jv  🎭  Javanese (Java, sub-national dialect)
 *     wuu 🏙️  Wu / Shanghainese (Sinitic regional dialect)
 *     sa  🕉️  Sanskrit (classical, no single nation-state)
 */

export type AlgoFamily =
  | 'ALGO-ROM'
  | 'ALGO-GER'
  | 'ALGO-SLV'
  | 'ALGO-SEM'
  | 'ALGO-SIN'
  | 'ALGO-JAP'
  | 'ALGO-KOR'
  | 'ALGO-BNT'
  | 'ALGO-KWA'
  | 'ALGO-CRV'
  | 'ALGO-IIR'
  | 'ALGO-DRV'
  | 'ALGO-TRK'
  | 'ALGO-FIN'
  | 'ALGO-TAI'
  | 'ALGO-VIET'
  | 'ALGO-AUS'
  | 'ALGO-CRE'
  | 'ALGO-ROBUST';

export interface LanguageFamilyConfig {
  family: AlgoFamily;
  label: string;
  flag: string;
  hasTones: boolean;
  hasVowelHarmony: boolean;
  syllableStructure: 'CV' | 'CVC' | 'CVCC' | 'complex';
  codaRelevance: 'none' | 'low' | 'medium' | 'high';
}

export const LANGUAGE_FLAGS: Record<string, string> = {
  // ── Romance ──────────────────────────────────────────────────────────────
  'fr': '🇫🇷', 'es': '🇪🇸', 'it': '🇮🇹', 'pt': '🇵🇹', 'ro': '🇷🇴', 'ca': '🇦🇩',
  // ── Germanic ─────────────────────────────────────────────────────────────
  'en': '🇬🇧', 'de': '🇩🇪', 'nl': '🇳🇱', 'sv': '🇸🇪', 'da': '🇩🇰', 'no': '🇳🇴', 'is': '🇮🇸',
  // ── Slavic ───────────────────────────────────────────────────────────────
  'ru': '🇷🇺', 'pl': '🇵🇱', 'cs': '🇨🇿', 'sk': '🇸🇰', 'uk': '🇺🇦', 'bg': '🇧🇬', 'sr': '🇷🇸', 'hr': '🇭🇷',
  // ── Semitic ──────────────────────────────────────────────────────────────
  'ar': '🇸🇦', 'he': '🇮🇱', 'am': '🇪🇹',
  // ── Sinitic (nation-state flags where applicable; dialect → picto) ────────
  'zh': '🇨🇳', 'yue': '🇭🇰', 'wuu': '🏙️',   // Wu/Shanghainese: Sinitic dialect, no single flag
  // ── Japanese / Korean ────────────────────────────────────────────────────
  'ja': '🇯🇵', 'ko': '🇰🇷',
  // ── Bantu / Niger-Congo ──────────────────────────────────────────────────
  'sw': '🇰🇪', 'yo': '🇳🇬', 'zu': '🇿🇦', 'xh': '🇿🇦', 'ha': '🇳🇬',
  'bm': '🇲🇱', 'ff': '🇬🇳', 'lua': '🇨🇩', 'mos': '🇧🇫',
  // ── KWA — canonical + short aliases ──────────────────────────────────────
  'bci': '🇨🇮', 'ba': '🇨🇮',   // Baoulé
  'ee':  '🇹🇬', 'ew': '🇹🇬',   // Ewe
  'gej': '🇹🇬', 'mi': '🇹🇬',   // Mina / Gen
  'dyu': '🇨🇮', 'di': '🇨🇮',   // Dioula
  // ── Cross River / Chadic (ethnic pictos for sub-national dialects) ────────
  'bkv': '🌿',                  // Bekwarra (Cross River, Nigeria)
  'ijn': '⚓',                  // Ijaw (Niger Delta, Nigeria)
  'iko': '🏺',                  // Ogoja (Cross River, Nigeria)
  // ── Indo-Iranian ─────────────────────────────────────────────────────────
  'hi': '🇮🇳', 'ur': '🇵🇰', 'bn': '🇧🇩', 'pa': '🇮🇳', 'fa': '🇮🇷',
  'sa': '🕉️',                   // Sanskrit: classical language, no nation-state flag
  // ── Dravidian ────────────────────────────────────────────────────────────
  'ta': '🇱🇰', 'te': '🇮🇳', 'kn': '🇮🇳', 'ml': '🇮🇳',
  // ── Turkic ───────────────────────────────────────────────────────────────
  'tr': '🇹🇷', 'uz': '🇺🇿', 'kk': '🇰🇿', 'az': '🇦🇿',
  // ── Uralic ───────────────────────────────────────────────────────────────
  'fi': '🇫🇮', 'et': '🇪🇪', 'hu': '🇭🇺',
  // ── Tai-Kadai ────────────────────────────────────────────────────────────
  'th': '🇹🇭', 'lo': '🇱🇦',
  // ── Austroasiatic ────────────────────────────────────────────────────────
  'vi': '🇻🇳', 'km': '🇰🇭',
  // ── Austronesian ─────────────────────────────────────────────────────────
  'id': '🇮🇩', 'id-id': '🇮🇩', 'ms': '🇲🇾', 'ms-my': '🇲🇾',
  'tl': '🇵🇭', 'jv': '🎭',     // Javanese: sub-national Java dialect, no single flag
  // ── Creole / Pidgin ───────────────────────────────────────────────────────
  'nou': '🇨🇮', 'pcm': '🇳🇬', 'cfg': '🇨🇲',
};

export const LANG_TO_FAMILY: Record<string, AlgoFamily> = {
  // Romance
  'fr': 'ALGO-ROM', 'es': 'ALGO-ROM', 'it': 'ALGO-ROM', 'pt': 'ALGO-ROM', 'ro': 'ALGO-ROM', 'ca': 'ALGO-ROM',
  // Germanic
  'en': 'ALGO-GER', 'de': 'ALGO-GER', 'nl': 'ALGO-GER', 'sv': 'ALGO-GER', 'da': 'ALGO-GER', 'no': 'ALGO-GER', 'is': 'ALGO-GER',
  // Slavic
  'ru': 'ALGO-SLV', 'pl': 'ALGO-SLV', 'cs': 'ALGO-SLV', 'sk': 'ALGO-SLV', 'uk': 'ALGO-SLV', 'bg': 'ALGO-SLV', 'sr': 'ALGO-SLV', 'hr': 'ALGO-SLV',
  // Semitic
  'ar': 'ALGO-SEM', 'he': 'ALGO-SEM', 'am': 'ALGO-SEM',
  // Sinitic
  'zh': 'ALGO-SIN', 'yue': 'ALGO-SIN', 'wuu': 'ALGO-SIN',
  // Japanese / Korean
  'ja': 'ALGO-JAP', 'ko': 'ALGO-KOR',
  // Bantu / Niger-Congo generic
  'sw': 'ALGO-BNT', 'yo': 'ALGO-BNT', 'zu': 'ALGO-BNT', 'xh': 'ALGO-BNT',
  'bm': 'ALGO-BNT', 'ff': 'ALGO-BNT', 'lua': 'ALGO-BNT', 'mos': 'ALGO-BNT',
  // KWA — canonical SIL/ISO 639-3 codes
  'bci': 'ALGO-KWA', 'dyu': 'ALGO-KWA', 'ee': 'ALGO-KWA', 'gej': 'ALGO-KWA',
  // KWA — LID short aliases (detectLanguage() word-pilot output)
  'ba':  'ALGO-KWA', 'di': 'ALGO-KWA', 'ew': 'ALGO-KWA', 'mi': 'ALGO-KWA',
  // Cross River / Chadic
  'bkv': 'ALGO-CRV', 'ijn': 'ALGO-CRV', 'iko': 'ALGO-CRV', 'ha': 'ALGO-CRV',
  // Indo-Iranian — Sanskrit shares ALGO-IIR (same family, distinct phonology handled at strategy level)
  'hi': 'ALGO-IIR', 'ur': 'ALGO-IIR', 'bn': 'ALGO-IIR', 'pa': 'ALGO-IIR', 'fa': 'ALGO-IIR',
  'sa': 'ALGO-IIR',
  // Dravidian
  'ta': 'ALGO-DRV', 'te': 'ALGO-DRV', 'kn': 'ALGO-DRV', 'ml': 'ALGO-DRV',
  // Turkic
  'tr': 'ALGO-TRK', 'uz': 'ALGO-TRK', 'kk': 'ALGO-TRK', 'az': 'ALGO-TRK',
  // Uralic
  'fi': 'ALGO-FIN', 'et': 'ALGO-FIN', 'hu': 'ALGO-FIN',
  // Tai-Kadai
  'th': 'ALGO-TAI', 'lo': 'ALGO-TAI',
  // Austroasiatic
  'vi': 'ALGO-VIET', 'km': 'ALGO-VIET',
  // Austronesian — ISO 639-1 + BCP-47 region variants
  'id': 'ALGO-AUS', 'id-id': 'ALGO-AUS', 'ms': 'ALGO-AUS', 'ms-my': 'ALGO-AUS',
  'tl': 'ALGO-AUS', 'jv': 'ALGO-AUS',
  // Creole / Pidgin
  'nou': 'ALGO-CRE', 'pcm': 'ALGO-CRE', 'cfg': 'ALGO-CRE',
};

export const FAMILY_CONFIG: Record<AlgoFamily, LanguageFamilyConfig> = {
  'ALGO-ROM':    { family: 'ALGO-ROM',    label: 'Romance',              flag: '🇫🇷', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'medium' },
  'ALGO-GER':    { family: 'ALGO-GER',    label: 'Germanic',             flag: '🇬🇧', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVCC',    codaRelevance: 'high' },
  'ALGO-SLV':    { family: 'ALGO-SLV',    label: 'Slavic',               flag: '🇷🇺', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVCC',    codaRelevance: 'high' },
  'ALGO-SEM':    { family: 'ALGO-SEM',    label: 'Semitic',              flag: '🇸🇦', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'medium' },
  'ALGO-SIN':    { family: 'ALGO-SIN',    label: 'Sinitic',              flag: '🇨🇳', hasTones: true,  hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'medium' },
  'ALGO-JAP':    { family: 'ALGO-JAP',    label: 'Japanese',             flag: '🇯🇵', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CV',      codaRelevance: 'low' },
  'ALGO-KOR':    { family: 'ALGO-KOR',    label: 'Korean',               flag: '🇰🇷', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'high' },
  'ALGO-BNT':    { family: 'ALGO-BNT',    label: 'Bantu',                flag: '🇰🇪', hasTones: true,  hasVowelHarmony: true,  syllableStructure: 'CV',      codaRelevance: 'medium' },
  'ALGO-KWA':    { family: 'ALGO-KWA',    label: 'Kwa (Niger-Congo)',    flag: '🇨🇮', hasTones: true,  hasVowelHarmony: true,  syllableStructure: 'CV',      codaRelevance: 'none' },
  'ALGO-CRV':    { family: 'ALGO-CRV',    label: 'Cross River / Chadic', flag: '🇳🇬', hasTones: true,  hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'medium' },
  // ALGO-IIR: syllableStructure set to 'complex' to cover both modern Hindi (CVC)
  // and Classical Sanskrit (laghu/guru weight system, conjunct consonants, sandhi).
  // Strategy implementations must check langCode === 'sa' to apply Sanskrit-specific
  // syllabification (mātrā-based weight) vs. Hindi (stress-accent based).
  'ALGO-IIR':    { family: 'ALGO-IIR',    label: 'Indo-Iranian',         flag: '🇮🇳', hasTones: false, hasVowelHarmony: false, syllableStructure: 'complex', codaRelevance: 'medium' },
  'ALGO-DRV':    { family: 'ALGO-DRV',    label: 'Dravidian',            flag: '🇮🇳', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'medium' },
  'ALGO-TRK':    { family: 'ALGO-TRK',    label: 'Turkic',               flag: '🇹🇷', hasTones: false, hasVowelHarmony: true,  syllableStructure: 'CVC',     codaRelevance: 'medium' },
  'ALGO-FIN':    { family: 'ALGO-FIN',    label: 'Uralic',               flag: '🇫🇮', hasTones: false, hasVowelHarmony: true,  syllableStructure: 'CVC',     codaRelevance: 'medium' },
  'ALGO-TAI':    { family: 'ALGO-TAI',    label: 'Tai-Kadai',            flag: '🇹🇭', hasTones: true,  hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'medium' },
  'ALGO-VIET':   { family: 'ALGO-VIET',   label: 'Austroasiatic',        flag: '🇻🇳', hasTones: true,  hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'high' },
  'ALGO-AUS':    { family: 'ALGO-AUS',    label: 'Austronesian',         flag: '🇮🇩', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CVC',     codaRelevance: 'low' },
  'ALGO-CRE':    { family: 'ALGO-CRE',    label: 'Creole / Pidgin',      flag: '🇨🇮', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CV',      codaRelevance: 'low' },
  'ALGO-ROBUST': { family: 'ALGO-ROBUST', label: 'Unknown / Fallback',   flag: '🌐', hasTones: false, hasVowelHarmony: false, syllableStructure: 'CV',      codaRelevance: 'none' },
};

export const getAlgoFamily = (langCode: string): AlgoFamily | undefined =>
  LANG_TO_FAMILY[langCode.toLowerCase()];

export const getFamilyConfig = (langCode: string): LanguageFamilyConfig | undefined => {
  const family = getAlgoFamily(langCode);
  return family ? FAMILY_CONFIG[family] : undefined;
};

export const isTonalLanguage = (langCode: string): boolean =>
  getFamilyConfig(langCode)?.hasTones ?? false;

export const TONE_DIACRITICS = [
  '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u030C',
];

export const getTonalDiacriticsPattern = (langCode?: string): RegExp => {
  if (!langCode || !isTonalLanguage(langCode)) return /[\u0300-\u036f]/g;
  return /[\u0305-\u030B\u030D-\u036f]/g;
};

export const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  // Germanic
  'english': 'en', 'german': 'de', 'dutch': 'nl', 'swedish': 'sv',
  'danish': 'da', 'norwegian': 'no', 'icelandic': 'is',
  // Romance
  'french': 'fr', 'spanish': 'es', 'italian': 'it', 'portuguese': 'pt',
  'romanian': 'ro', 'catalan': 'ca',
  // Slavic
  'russian': 'ru', 'polish': 'pl', 'czech': 'cs', 'slovak': 'sk',
  'ukrainian': 'uk', 'bulgarian': 'bg', 'serbian': 'sr', 'croatian': 'hr',
  // Niger-Congo / Bantu
  'yoruba': 'yo', 'swahili': 'sw', 'zulu': 'zu', 'xhosa': 'xh', 'hausa': 'ha',
  // KWA — all surface forms map to canonical codes
  'baoulé': 'bci', 'baoule': 'bci', 'baule': 'bci',
  'dioula': 'dyu', 'dyula': 'dyu', 'jula': 'dyu',
  'ewe': 'ee',
  'mina': 'gej', 'gen': 'gej', 'gengebe': 'gej', 'gengèbé': 'gej',
  // Mande
  'bambara': 'bm', 'dioula bambara': 'bm',
  'fula': 'ff', 'fulfulde': 'ff', 'peul': 'ff',
  'luba': 'lua', 'moore': 'mos', 'mooré': 'mos',
  // Cross River
  'bekwarra': 'bkv', 'ijaw': 'ijn', 'ogoja': 'iko',
  // Creole
  'nouchi': 'nou', 'nigerian pidgin': 'pcm', 'pidgin': 'pcm', 'camfranglais': 'cfg',
  // Asia / Pacific
  'chinese': 'zh', 'mandarin': 'zh', 'cantonese': 'yue', 'wu': 'wuu', 'shanghainese': 'wuu',
  'japanese': 'ja', 'korean': 'ko', 'javanese': 'jv',
  'hindi': 'hi', 'urdu': 'ur', 'bengali': 'bn', 'punjabi': 'pa', 'persian': 'fa',
  // Sanskrit — multiple surface forms (classical + transliterated)
  'sanskrit': 'sa', 'samskrita': 'sa', 'saṃskṛta': 'sa', 'संस्कृत': 'sa',
  'tamil': 'ta', 'telugu': 'te', 'kannada': 'kn', 'malayalam': 'ml',
  'thai': 'th', 'lao': 'lo', 'vietnamese': 'vi', 'khmer': 'km',
  'indonesian': 'id', 'malay': 'ms', 'tagalog': 'tl',
  // Semitic / other
  'arabic': 'ar', 'hebrew': 'he', 'amharic': 'am',
  'turkish': 'tr', 'uzbek': 'uz', 'kazakh': 'kk', 'azerbaijani': 'az',
  'finnish': 'fi', 'estonian': 'et', 'hungarian': 'hu',
};

export const languageNameToCode = (languageName: string): string | undefined => {
  if (!languageName) return undefined;
  const normalized = languageName.toLowerCase().trim();
  if (LANG_TO_FAMILY[normalized]) return normalized;
  return LANGUAGE_NAME_TO_CODE[normalized];
};

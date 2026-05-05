/**
 * Language metadata for the Lyricist Pro UI locale system.
 * These are static, versioned, human-reviewed translation packs.
 */
export interface UiLocaleInfo {
  /** BCP-47 language code used as locale key (e.g. 'en', 'fr') */
  code: string;
  /** Native display name of the language */
  label: string;
  /** Flag emoji for the locale */
  flag: string;
  /** Text direction */
  dir: 'ltr' | 'rtl';
  /**
   * When true, this locale was bootstrapped by AI and is pending human review.
   * The UI will display a visible "Preview – AI draft" badge.
   */
  isAiGenerated?: boolean;
}

/**
 * Language entry for the AI-powered song/section content adaptation feature.
 *
 * NOTE: These are entirely distinct from UI locales. They drive the AI prompt
 * asking the model to rewrite lyrics in a target language/culture — they do
 * NOT affect the interface strings.
 */
export interface AdaptationLanguage {
  /** Short display code shown in compact selectors (e.g. 'AR', 'ZH') */
  code: string;
  /** Full language name passed verbatim to the AI adaptation prompt */
  aiName: string;
  /** Visual sign shown in selectors and badges */
  sign: string;
  /** Optional region/context label for disambiguation in dropdowns */
  region?: string;
  /** Whether the language uses a cultural mark rather than a country flag */
  isEthnical?: boolean;
}

// ---------------------------------------------------------------------------
// UI Locales — static, versioned, reviewed packs
// ---------------------------------------------------------------------------

export const SUPPORTED_UI_LOCALES: readonly UiLocaleInfo[] = [
  { code: 'en', label: 'English',    flag: '🇺🇸', dir: 'ltr' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', label: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹', dir: 'ltr' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', label: '中文',        flag: '🇨🇳', dir: 'ltr' },
  { code: 'ko', label: '한국어',      flag: '🇰🇷', dir: 'ltr' },
] as const;

export type SupportedUiLocaleCode = typeof SUPPORTED_UI_LOCALES[number]['code'];

// ---------------------------------------------------------------------------
// Adaptation Languages — for AI creative lyric adaptation
// Sorted alphabetically by aiName for consistent dropdown order.
//
// sign conventions:
//   - Nation flag   : language tied to a sovereign state (standard)
//   - Ethnic picto  : dialect / regional language without a dedicated flag;
//                     each picto is chosen for cultural resonance, NOT generic.
//                     isEthnical: true marks these entries.
//
// Picto uniqueness rule: no two ethnic entries may share the same sign.
// ---------------------------------------------------------------------------

export const SUPPORTED_ADAPTATION_LANGUAGES: readonly AdaptationLanguage[] = [
  // A
  { code: 'AM',  aiName: 'Amharic',         sign: '🇪🇹', region: 'Ethiopia - East Africa' },
  { code: 'AR',  aiName: 'Arabic',           sign: '🇸🇦', region: 'Arab World' },
  { code: 'AZ',  aiName: 'Azerbaijani',      sign: '🇦🇿' },
  // B
  { code: 'BA',  aiName: 'Baoulé',           sign: '🌿', region: 'Ivory Coast - West Africa', isEthnical: true },
  { code: 'BK',  aiName: 'Bekwarra',         sign: '🏹', region: 'Nigeria - Cross River', isEthnical: true },
  { code: 'BN',  aiName: 'Bengali',          sign: '🇧🇩', region: 'Bangladesh / West Bengal' },
  { code: 'BG',  aiName: 'Bulgarian',        sign: '🇧🇬' },
  { code: 'BM',  aiName: 'Bambara',          sign: '🦅', region: 'Mali - West Africa', isEthnical: true },
  // C
  { code: 'CB',  aiName: 'Calabari',         sign: '🐚', region: 'Niger Delta - Nigeria', isEthnical: true },
  { code: 'YUE', aiName: 'Cantonese',        sign: '🇭🇰', region: 'Hong Kong / Guangdong' },
  { code: 'CFG', aiName: 'Camfranglais',     sign: '🇨🇲', region: 'Cameroon - Urban Creole' },
  { code: 'ZH',  aiName: 'Chinese',          sign: '🇨🇳', region: 'Mandarin' },
  { code: 'HR',  aiName: 'Croatian',         sign: '🇭🇷' },
  { code: 'CS',  aiName: 'Czech',            sign: '🇨🇿' },
  // D
  { code: 'DA',  aiName: 'Danish',           sign: '🇩🇰' },
  { code: 'DI',  aiName: 'Dioula',           sign: '🧭', region: 'Ivory Coast/Burkina Faso - West Africa', isEthnical: true },
  { code: 'NL',  aiName: 'Dutch',            sign: '🇳🇱' },
  // E
  { code: 'EN',  aiName: 'English',          sign: '🇺🇸', region: 'United States' },
  { code: 'ET',  aiName: 'Estonian',         sign: '🇪🇪' },
  { code: 'EW',  aiName: 'Ewe',              sign: '🪘', region: 'Togo - Volta Region', isEthnical: true },
  // F
  { code: 'FA',  aiName: 'Farsi',            sign: '🇮🇷', region: 'Persian - Iran' },
  { code: 'FI',  aiName: 'Finnish',          sign: '🇫🇮' },
  { code: 'FF',  aiName: 'Fula',             sign: '🐄', region: 'West Africa (Sahel)', isEthnical: true },
  { code: 'FR',  aiName: 'French',           sign: '🇫🇷' },
  // G
  { code: 'DE',  aiName: 'German',           sign: '🇩🇪' },
  // H
  { code: 'HA',  aiName: 'Hausa',            sign: '🇳🇬', region: 'Nigeria/Niger - West Africa' },
  { code: 'HE',  aiName: 'Hebrew',           sign: '🇮🇱' },
  { code: 'HI',  aiName: 'Hindi',            sign: '🇮🇳' },
  { code: 'HU',  aiName: 'Hungarian',        sign: '🇭🇺' },
  // I
  { code: 'IS',  aiName: 'Icelandic',        sign: '🇮🇸' },
  { code: 'ID',  aiName: 'Indonesian',       sign: '🇮🇩' },
  { code: 'IT',  aiName: 'Italian',          sign: '🇮🇹' },
  // J
  { code: 'JA',  aiName: 'Japanese',         sign: '🇯🇵' },
  { code: 'JV',  aiName: 'Javanese',         sign: '🎭', region: 'Java - Indonesia', isEthnical: true },
  // K
  { code: 'KN',  aiName: 'Kannada',          sign: '🇮🇳', region: 'Karnataka - South India' },
  { code: 'KK',  aiName: 'Kazakh',           sign: '🇰🇿' },
  { code: 'KM',  aiName: 'Khmer',            sign: '🇰🇭', region: 'Cambodia' },
  { code: 'KO',  aiName: 'Korean',           sign: '🇰🇷', region: 'South Korea' },
  // L
  { code: 'LO',  aiName: 'Lao',              sign: '🇱🇦' },
  { code: 'LN',  aiName: 'Lingala',          sign: '🥁', region: 'Congo - Central Africa', isEthnical: true },
  // M
  { code: 'MS',  aiName: 'Malay',            sign: '🇲🇾' },
  { code: 'ML',  aiName: 'Malayalam',        sign: '🇮🇳', region: 'Kerala' },
  { code: 'MI',  aiName: 'Mina',             sign: '🌊', region: 'Togo - Maritime Region', isEthnical: true },
  // N
  { code: 'PCM', aiName: 'Nigerian Pidgin',  sign: '🇳🇬', region: 'Nigeria - Urban Creole' },
  { code: 'NOU', aiName: 'Nouchi',           sign: '🇨🇮', region: 'Ivory Coast - Urban Creole' },
  { code: 'NO',  aiName: 'Norwegian',        sign: '🇳🇴' },
  // O
  { code: 'OG',  aiName: 'Ogoja',            sign: '🗿', region: 'Cross River - Nigeria', isEthnical: true },
  // P
  { code: 'PL',  aiName: 'Polish',           sign: '🇵🇱' },
  { code: 'PA',  aiName: 'Punjabi',          sign: '🇮🇳', region: 'Punjab' },
  { code: 'PT',  aiName: 'Portuguese',       sign: '🇵🇹' },
  // R
  { code: 'RO',  aiName: 'Romanian',         sign: '🇷🇴' },
  { code: 'RU',  aiName: 'Russian',          sign: '🇷🇺' },
  // S
  { code: 'SA',  aiName: 'Sanskrit',         sign: '🕉️', region: 'Classical / Vedic', isEthnical: true },
  { code: 'SR',  aiName: 'Serbian',          sign: '🇷🇸' },
  { code: 'SK',  aiName: 'Slovak',           sign: '🇸🇰' },
  { code: 'ES',  aiName: 'Spanish',          sign: '🇪🇸' },
  { code: 'SW',  aiName: 'Swahili',          sign: '🇰🇪', region: 'East Africa' },
  { code: 'SV',  aiName: 'Swedish',          sign: '🇸🇪' },
  // T
  { code: 'TL',  aiName: 'Tagalog',          sign: '🇵🇭' },
  { code: 'TA',  aiName: 'Tamil',            sign: '🇮🇳', region: 'Tamil Nadu / Sri Lanka' },
  { code: 'TE',  aiName: 'Telugu',           sign: '🇮🇳', region: 'Andhra Pradesh' },
  { code: 'TH',  aiName: 'Thai',             sign: '🇹🇭' },
  { code: 'TR',  aiName: 'Turkish',          sign: '🇹🇷' },
  // U
  { code: 'UK',  aiName: 'Ukrainian',        sign: '🇺🇦' },
  { code: 'UR',  aiName: 'Urdu',             sign: '🇵🇰' },
  { code: 'UZ',  aiName: 'Uzbek',            sign: '🇺🇿' },
  // V
  { code: 'VI',  aiName: 'Vietnamese',       sign: '🇻🇳' },
  // W
  { code: 'WO',  aiName: 'Wolof',            sign: '🦁', region: 'Senegal - West Africa', isEthnical: true },
  // Y
  { code: 'YO',  aiName: 'Yoruba',           sign: '🎺', region: 'Nigeria - West Africa', isEthnical: true },
  // Z
  { code: 'ZU',  aiName: 'Zulu',             sign: '🛡️', region: 'South Africa', isEthnical: true },
] as const;

/**
 * Sentinel value used as the `value` prop in language selectors to indicate
 * the user wants to type a custom language name instead of picking from the list.
 * Never passed to the AI — components must substitute the user-typed text.
 */
export const CUSTOM_LANGUAGE_VALUE = '__custom__' as const;

/**
 * Returns true when the stored language value is the custom-language sentinel.
 * Use this to decide whether to show/read the free-text input instead of the
 * drop-down selection, and to gate the AI call (must not fire with the sentinel).
 */
export function isCustomAdaptationLanguage(value: string): boolean {
  return value === CUSTOM_LANGUAGE_VALUE;
}

/** Returns the formatted display label for use in dropdown menus. */
export function adaptationLanguageLabel(lang: AdaptationLanguage): string {
  return `${lang.sign} ${lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}`;
}

type LanguageDisplay = {
  label: string;
  sign: string;
  region?: string;
  isEthnical?: boolean;
};

/** Normalize language codes and labels for case-insensitive display lookup. */
const normalizeLanguageKey = (value: string) => value.trim().toLowerCase();

// Seed the index with UI locales first (lowercase codes: 'en', 'fr', …).
// These entries are only used when looking up a UI locale code — adaptation
// language codes are uppercase ('EN', 'FR', …) and will overwrite below.
const LANGUAGE_DISPLAY_INDEX = new Map<string, LanguageDisplay>(
  SUPPORTED_UI_LOCALES.flatMap((locale) => [
    [normalizeLanguageKey(locale.code), { label: locale.label, sign: locale.flag }],
    [normalizeLanguageKey(locale.label), { label: locale.label, sign: locale.flag }],
  ] as const),
);

for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
  const adaptationDisplay: LanguageDisplay = {
    label: lang.aiName,
    sign: lang.sign,
    ...(lang.region !== undefined && { region: lang.region }),
    ...(lang.isEthnical !== undefined && { isEthnical: lang.isEthnical }),
  };

  // Always write adaptation entries — they must win over any UI-locale seed.
  // Index by both the raw code ('NO', 'SV') and its normalised form ('no', 'sv')
  // so lookups succeed regardless of the casing passed by callers.
  LANGUAGE_DISPLAY_INDEX.set(lang.code, adaptationDisplay);
  LANGUAGE_DISPLAY_INDEX.set(normalizeLanguageKey(lang.code), adaptationDisplay);

  // Also index by aiName for label-based lookups (case-insensitive).
  LANGUAGE_DISPLAY_INDEX.set(normalizeLanguageKey(lang.aiName), adaptationDisplay);
}

export function getLanguageDisplay(value: string): LanguageDisplay {
  const fallbackLabel = value.trim() || 'Unknown';
  // Try the raw value first (handles uppercase codes like 'NO', 'SV' directly).
  return (
    LANGUAGE_DISPLAY_INDEX.get(value.trim()) ??
    LANGUAGE_DISPLAY_INDEX.get(normalizeLanguageKey(value)) ?? {
      label: fallbackLabel,
      sign: '🌐',
    }
  );
}

export function formatLanguageDisplay(value: string): string {
  const { label, sign } = getLanguageDisplay(value);
  return `${sign} ${label}`;
}

/**
 * Resolves a UI locale code (e.g. 'fr') to a language name suitable for AI prompts.
 * Returns the locale's native label (e.g. 'Français') or 'English' as a fallback.
 * AI models reliably understand native language names in prompt instructions.
 */
export function getUiLanguageNameForAi(code: string): string {
  const locale = SUPPORTED_UI_LOCALES.find(l => l.code === code);
  return locale?.label || 'English';
}

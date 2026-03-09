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
  /** Optional region/context label for disambiguation in dropdowns */
  region?: string;
}

// ---------------------------------------------------------------------------
// UI Locales — static, versioned, reviewed packs
// ---------------------------------------------------------------------------

export const SUPPORTED_UI_LOCALES: readonly UiLocaleInfo[] = [
  { code: 'en', label: 'English',    flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', label: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹', dir: 'ltr' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', label: '中文',        flag: '🇨🇳', dir: 'ltr' },
] as const;

export type SupportedUiLocaleCode = typeof SUPPORTED_UI_LOCALES[number]['code'];

// ---------------------------------------------------------------------------
// Adaptation Languages — for AI creative lyric adaptation
// ---------------------------------------------------------------------------

export const SUPPORTED_ADAPTATION_LANGUAGES: readonly AdaptationLanguage[] = [
  { code: 'AM', aiName: 'Amharic',   region: 'Ethiopia - East Africa' },
  { code: 'AR', aiName: 'Arabic' },
  { code: 'BA', aiName: 'Baoulé',    region: 'Ivory Coast - West Africa' },
  { code: 'ZH', aiName: 'Chinese',   region: 'Mandarin' },
  { code: 'DI', aiName: 'Dioula',    region: 'Ivory Coast/Burkina Faso - West Africa' },
  { code: 'EN', aiName: 'English' },
  { code: 'FR', aiName: 'French' },
  { code: 'DE', aiName: 'German' },
  { code: 'HA', aiName: 'Hausa',     region: 'Nigeria/Niger - West Africa' },
  { code: 'IT', aiName: 'Italian' },
  { code: 'JA', aiName: 'Japanese' },
  { code: 'KO', aiName: 'Korean',    region: 'South Korea' },
  { code: 'LN', aiName: 'Lingala',   region: 'Congo - Central Africa' },
  { code: 'PT', aiName: 'Portuguese' },
  { code: 'ES', aiName: 'Spanish' },
  { code: 'SW', aiName: 'Swahili',   region: 'East Africa' },
  { code: 'WO', aiName: 'Wolof',     region: 'Senegal - West Africa' },
  { code: 'YO', aiName: 'Yoruba',    region: 'Nigeria - West Africa' },
  { code: 'ZU', aiName: 'Zulu',      region: 'South Africa' },
] as const;

/** Returns the formatted display label for use in dropdown menus. */
export function adaptationLanguageLabel(lang: AdaptationLanguage): string {
  return lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName;
}

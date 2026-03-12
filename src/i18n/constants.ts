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
  { code: 'AM', aiName: 'Amharic', sign: '🇪🇹', region: 'Ethiopia - East Africa' },
  { code: 'AR', aiName: 'Arabic', sign: '🇸🇦' },
  { code: 'BA', aiName: 'Baoulé', sign: '🪘', region: 'Ivory Coast - West Africa', isEthnical: true },
  { code: 'ZH', aiName: 'Chinese', sign: '🇨🇳', region: 'Mandarin' },
  { code: 'DI', aiName: 'Dioula', sign: '🪘', region: 'Ivory Coast/Burkina Faso - West Africa', isEthnical: true },
  { code: 'EN', aiName: 'English', sign: '🇬🇧' },
  { code: 'FR', aiName: 'French', sign: '🇫🇷' },
  { code: 'DE', aiName: 'German', sign: '🇩🇪' },
  { code: 'HA', aiName: 'Hausa', sign: '🪘', region: 'Nigeria/Niger - West Africa', isEthnical: true },
  { code: 'IT', aiName: 'Italian', sign: '🇮🇹' },
  { code: 'JA', aiName: 'Japanese', sign: '🇯🇵' },
  { code: 'KO', aiName: 'Korean', sign: '🇰🇷', region: 'South Korea' },
  { code: 'LN', aiName: 'Lingala', sign: '🪘', region: 'Congo - Central Africa', isEthnical: true },
  { code: 'PT', aiName: 'Portuguese', sign: '🇵🇹' },
  { code: 'ES', aiName: 'Spanish', sign: '🇪🇸' },
  { code: 'SW', aiName: 'Swahili', sign: '🇹🇿', region: 'East Africa' },
  { code: 'WO', aiName: 'Wolof', sign: '🪘', region: 'Senegal - West Africa', isEthnical: true },
  { code: 'YO', aiName: 'Yoruba', sign: '🪘', region: 'Nigeria - West Africa', isEthnical: true },
  { code: 'ZU', aiName: 'Zulu', sign: '🪘', region: 'South Africa', isEthnical: true },
] as const;

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

const LANGUAGE_DISPLAY_INDEX = new Map<string, LanguageDisplay>([
  ...SUPPORTED_UI_LOCALES.flatMap((locale) => [
    [normalizeLanguageKey(locale.code), { label: locale.label, sign: locale.flag }],
    [normalizeLanguageKey(locale.label), { label: locale.label, sign: locale.flag }],
  ] as const),
  ...SUPPORTED_ADAPTATION_LANGUAGES.flatMap((lang) => [
    [normalizeLanguageKey(lang.code), { label: lang.aiName, sign: lang.sign, region: lang.region, isEthnical: lang.isEthnical }],
    [normalizeLanguageKey(lang.aiName), { label: lang.aiName, sign: lang.sign, region: lang.region, isEthnical: lang.isEthnical }],
  ] as const),
]);

export function getLanguageDisplay(value: string): LanguageDisplay {
  const fallbackLabel = value.trim() || 'Unknown';
  return LANGUAGE_DISPLAY_INDEX.get(normalizeLanguageKey(value)) ?? { label: fallbackLabel, sign: '🌐' };
}

export function formatLanguageDisplay(value: string): string {
  const { label, sign } = getLanguageDisplay(value);
  return `${sign} ${label}`;
}

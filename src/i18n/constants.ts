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
  { code: 'ko', label: '한국어',      flag: '🇰🇷', dir: 'ltr' },
] as const;

export type SupportedUiLocaleCode = typeof SUPPORTED_UI_LOCALES[number]['code'];

// ---------------------------------------------------------------------------
// Adaptation Languages — for AI creative lyric adaptation
// ---------------------------------------------------------------------------

export const SUPPORTED_ADAPTATION_LANGUAGES: readonly AdaptationLanguage[] = [
  { code: 'AM', aiName: 'Amharic', sign: '🇪🇹', region: 'Ethiopia - East Africa' },
  { code: 'AR', aiName: 'Arabic', sign: '🇸🇦' },
  { code: 'BA', aiName: 'Baoulé', sign: '🪘', region: 'Ivory Coast - West Africa', isEthnical: true },
  { code: 'BK', aiName: 'Bekwarra', sign: '🪘', region: 'Nigeria - Cross River', isEthnical: true },
  { code: 'CB', aiName: 'Calabari', sign: '🪘', region: 'Niger Delta - Nigeria', isEthnical: true },
  { code: 'ZH', aiName: 'Chinese', sign: '🇨🇳', region: 'Mandarin' },
  { code: 'DI', aiName: 'Dioula', sign: '🪘', region: 'Ivory Coast/Burkina Faso - West Africa', isEthnical: true },
  { code: 'EW', aiName: 'Ewe', sign: '🪘', region: 'Togo - Volta Region', isEthnical: true },
  { code: 'EN', aiName: 'English', sign: '🇬🇧' },
  { code: 'FR', aiName: 'French', sign: '🇫🇷' },
  { code: 'DE', aiName: 'German', sign: '🇩🇪' },
  { code: 'HA', aiName: 'Hausa', sign: '🪘', region: 'Nigeria/Niger - West Africa', isEthnical: true },
  { code: 'IT', aiName: 'Italian', sign: '🇮🇹' },
  { code: 'JA', aiName: 'Japanese', sign: '🇯🇵' },
  { code: 'KO', aiName: 'Korean', sign: '🇰🇷', region: 'South Korea' },
  { code: 'LN', aiName: 'Lingala', sign: '🪘', region: 'Congo - Central Africa', isEthnical: true },
  { code: 'MI', aiName: 'Mina', sign: '🪘', region: 'Togo - Maritime Region', isEthnical: true },
  { code: 'OG', aiName: 'Ogoja', sign: '🪘', region: 'Cross River - Nigeria', isEthnical: true },
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

const LANGUAGE_DISPLAY_INDEX = new Map<string, LanguageDisplay>(
  SUPPORTED_UI_LOCALES.flatMap((locale) => [
    [normalizeLanguageKey(locale.code), { label: locale.label, sign: locale.flag }],
    [normalizeLanguageKey(locale.label), { label: locale.label, sign: locale.flag }],
  ] as const),
);

for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
  // Conditional spread: omit optional keys when value is undefined to satisfy
  // exactOptionalPropertyTypes (LanguageDisplay.region?: string excludes undefined).
  const adaptationDisplay: LanguageDisplay = {
    label: lang.aiName,
    sign: lang.sign,
    ...(lang.region !== undefined && { region: lang.region }),
    ...(lang.isEthnical !== undefined && { isEthnical: lang.isEthnical }),
  };
  const normalizedCode = normalizeLanguageKey(lang.code);
  // UI locale codes and adaptation codes can overlap (for example `ko` vs `KO`).
  // Preserve the UI-locale display entry for code-based lookups, while still
  // indexing the adaptation language by its human-readable name.
  if (!LANGUAGE_DISPLAY_INDEX.has(normalizedCode)) {
    LANGUAGE_DISPLAY_INDEX.set(normalizedCode, adaptationDisplay);
  }
  LANGUAGE_DISPLAY_INDEX.set(normalizeLanguageKey(lang.aiName), adaptationDisplay);
}

export function getLanguageDisplay(value: string): LanguageDisplay {
  const fallbackLabel = value.trim() || 'Unknown';
  return LANGUAGE_DISPLAY_INDEX.get(normalizeLanguageKey(value)) ?? { label: fallbackLabel, sign: '🌐' };
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

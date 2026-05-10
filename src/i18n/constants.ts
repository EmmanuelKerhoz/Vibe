/**
 * Branded `LangId` type — a canonical opaque identifier for a language entry.
 *
 * Format:
 *   - "ui:<code>"     for SUPPORTED_UI_LOCALES        (e.g. "ui:fr")
 *   - "adapt:<CODE>"  for SUPPORTED_ADAPTATION_LANGUAGES (e.g. "adapt:ES")
 *   - "custom:<text>" for free-input adaptation languages (e.g. "custom:Scots Gaelic")
 *
 * The brand prevents arbitrary strings (bare codes, aiNames, sign emoji) from
 * being silently passed where a langId is required — those would compile-error,
 * forcing the caller to migrate via `asLangId()` for runtime-validated narrowing
 * or `migrateToLangId()` for legacy-tolerant conversion at storage/transport
 * boundaries.
 */
export type LangId = string & { readonly __brand: 'LangId' };

/**
 * Semantic alias for `LangId` scoped to the adaptation pipeline.
 *
 * Functionally identical to `LangId` — it IS `LangId` — but signals at call-
 * sites that the value must be a canonical adaptation-domain identifier
 * ("adapt:<CODE>" or "custom:<text>"). Using this alias on public function
 * signatures makes TS error immediately when a raw `string` (bare code,
 * aiName, legacy value) is passed without going through `asLangId()` or
 * `migrateAdaptationToLangId()` first.
 *
 * Rollout strategy: start with the 2 central pipeline entry points
 * (`langIdToAiName`, `getAdaptationLanguageByLangId`) and the 2 public hook
 * methods (`adaptSongLanguage`, `adaptSectionLanguage`). Expand progressively.
 */
export type AdaptationLangId = LangId;

/** Sentinel prefix for free-input adaptation languages. */
export const CUSTOM_LANG_ID_PREFIX = 'custom:' as const;

/**
 * Language metadata for the Lyricist Pro UI locale system.
 * These are static, versioned, human-reviewed translation packs.
 */
export interface UiLocaleInfo {
  /** Stable opaque identifier — use as storage key. Format: "ui:<code>" */
  langId: string;
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
  /** Stable opaque identifier — use as storage key. Format: "adapt:<CODE>" */
  langId: string;
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
// langId format: "ui:<code>" — stable across renames, never store raw code.
// ---------------------------------------------------------------------------

export const SUPPORTED_UI_LOCALES: readonly UiLocaleInfo[] = [
  { langId: 'ui:en', code: 'en', label: 'English',    flag: '🇺🇸', dir: 'ltr' },
  { langId: 'ui:fr', code: 'fr', label: 'Français',   flag: '🇫🇷', dir: 'ltr' },
  { langId: 'ui:es', code: 'es', label: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  { langId: 'ui:de', code: 'de', label: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
  { langId: 'ui:pt', code: 'pt', label: 'Português',  flag: '🇵🇹', dir: 'ltr' },
  { langId: 'ui:ar', code: 'ar', label: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
  { langId: 'ui:zh', code: 'zh', label: '中文',        flag: '🇨🇳', dir: 'ltr' },
  { langId: 'ui:ko', code: 'ko', label: '한국어',      flag: '🇰🇷', dir: 'ltr' },
] as const;

export type SupportedUiLocaleCode = typeof SUPPORTED_UI_LOCALES[number]['code'];

// ---------------------------------------------------------------------------
// Adaptation Languages — for AI creative lyric adaptation
// Sorted alphabetically by aiName for consistent dropdown order.
//
// langId format: "adapt:<CODE>" — stable opaque key for storage and lookup.
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
  { langId: 'adapt:AM',  code: 'AM',  aiName: 'Amharic',         sign: '🇪🇹', region: 'Ethiopia - East Africa' },
  { langId: 'adapt:AR',  code: 'AR',  aiName: 'Arabic',           sign: '🇸🇦', region: 'Arab World' },
  { langId: 'adapt:AZ',  code: 'AZ',  aiName: 'Azerbaijani',      sign: '🇦🇿' },
  // B
  { langId: 'adapt:BA',  code: 'BA',  aiName: 'Baoulé',           sign: '🌿', region: 'Ivory Coast - West Africa', isEthnical: true },
  { langId: 'adapt:BK',  code: 'BK',  aiName: 'Bekwarra',         sign: '🏹', region: 'Nigeria - Cross River', isEthnical: true },
  { langId: 'adapt:BN',  code: 'BN',  aiName: 'Bengali',          sign: '🇧🇩', region: 'Bangladesh / West Bengal' },
  { langId: 'adapt:BG',  code: 'BG',  aiName: 'Bulgarian',        sign: '🇧🇬' },
  { langId: 'adapt:BM',  code: 'BM',  aiName: 'Bambara',          sign: '🦅', region: 'Mali - West Africa', isEthnical: true },
  // C
  { langId: 'adapt:CB',  code: 'CB',  aiName: 'Calabari',         sign: '🐚', region: 'Niger Delta - Nigeria', isEthnical: true },
  { langId: 'adapt:YUE', code: 'YUE', aiName: 'Cantonese',        sign: '🇭🇰', region: 'Hong Kong / Guangdong' },
  { langId: 'adapt:CFG', code: 'CFG', aiName: 'Camfranglais',     sign: '🇨🇲', region: 'Cameroon - Urban Creole' },
  { langId: 'adapt:ZH',  code: 'ZH',  aiName: 'Chinese',          sign: '🇨🇳', region: 'Mandarin' },
  { langId: 'adapt:HR',  code: 'HR',  aiName: 'Croatian',         sign: '🇭🇷' },
  { langId: 'adapt:CS',  code: 'CS',  aiName: 'Czech',            sign: '🇨🇿' },
  // D
  { langId: 'adapt:DA',  code: 'DA',  aiName: 'Danish',           sign: '🇩🇰' },
  { langId: 'adapt:DI',  code: 'DI',  aiName: 'Dioula',           sign: '🧭', region: 'Ivory Coast/Burkina Faso - West Africa', isEthnical: true },
  { langId: 'adapt:NL',  code: 'NL',  aiName: 'Dutch',            sign: '🇳🇱' },
  // E
  { langId: 'adapt:EN',  code: 'EN',  aiName: 'English',          sign: '🇺🇸', region: 'United States' },
  { langId: 'adapt:ET',  code: 'ET',  aiName: 'Estonian',         sign: '🇪🇪' },
  { langId: 'adapt:EW',  code: 'EW',  aiName: 'Ewe',              sign: '🪘', region: 'Togo - Volta Region', isEthnical: true },
  // F
  { langId: 'adapt:FA',  code: 'FA',  aiName: 'Farsi',            sign: '🇮🇷', region: 'Persian - Iran' },
  { langId: 'adapt:FI',  code: 'FI',  aiName: 'Finnish',          sign: '🇫🇮' },
  { langId: 'adapt:FF',  code: 'FF',  aiName: 'Fula',             sign: '🐄', region: 'West Africa (Sahel)', isEthnical: true },
  { langId: 'adapt:FR',  code: 'FR',  aiName: 'French',           sign: '🇫🇷' },
  // G
  { langId: 'adapt:DE',  code: 'DE',  aiName: 'German',           sign: '🇩🇪' },
  // H
  { langId: 'adapt:HA',  code: 'HA',  aiName: 'Hausa',            sign: '🇳🇬', region: 'Nigeria/Niger - West Africa' },
  { langId: 'adapt:HE',  code: 'HE',  aiName: 'Hebrew',           sign: '🇮🇱' },
  { langId: 'adapt:HI',  code: 'HI',  aiName: 'Hindi',            sign: '🇮🇳' },
  { langId: 'adapt:HU',  code: 'HU',  aiName: 'Hungarian',        sign: '🇭🇺' },
  // I
  { langId: 'adapt:IS',  code: 'IS',  aiName: 'Icelandic',        sign: '🇮🇸' },
  { langId: 'adapt:ID',  code: 'ID',  aiName: 'Indonesian',       sign: '🇮🇩' },
  { langId: 'adapt:IT',  code: 'IT',  aiName: 'Italian',          sign: '🇮🇹' },
  // J
  { langId: 'adapt:JA',  code: 'JA',  aiName: 'Japanese',         sign: '🇯🇵' },
  { langId: 'adapt:JV',  code: 'JV',  aiName: 'Javanese',         sign: '🎭', region: 'Java - Indonesia', isEthnical: true },
  // K
  { langId: 'adapt:KN',  code: 'KN',  aiName: 'Kannada',          sign: '🇮🇳', region: 'Karnataka - South India' },
  { langId: 'adapt:KK',  code: 'KK',  aiName: 'Kazakh',           sign: '🇰🇿' },
  { langId: 'adapt:KM',  code: 'KM',  aiName: 'Khmer',            sign: '🇰🇭', region: 'Cambodia' },
  { langId: 'adapt:KO',  code: 'KO',  aiName: 'Korean',           sign: '🇰🇷', region: 'South Korea' },
  // L
  { langId: 'adapt:LO',  code: 'LO',  aiName: 'Lao',              sign: '🇱🇦' },
  { langId: 'adapt:LN',  code: 'LN',  aiName: 'Lingala',          sign: '🥁', region: 'Congo - Central Africa', isEthnical: true },
  // M
  { langId: 'adapt:MS',  code: 'MS',  aiName: 'Malay',            sign: '🇲🇾' },
  { langId: 'adapt:ML',  code: 'ML',  aiName: 'Malayalam',        sign: '🇮🇳', region: 'Kerala' },
  { langId: 'adapt:MI',  code: 'MI',  aiName: 'Mina',             sign: '🌊', region: 'Togo - Maritime Region', isEthnical: true },
  // N
  { langId: 'adapt:PCM', code: 'PCM', aiName: 'Nigerian Pidgin',  sign: '🇳🇬', region: 'Nigeria - Urban Creole' },
  { langId: 'adapt:NOU', code: 'NOU', aiName: 'Nouchi',           sign: '🇨🇮', region: 'Ivory Coast - Urban Creole' },
  { langId: 'adapt:NO',  code: 'NO',  aiName: 'Norwegian',        sign: '🇳🇴' },
  // O
  { langId: 'adapt:OG',  code: 'OG',  aiName: 'Ogoja',            sign: '🗿', region: 'Cross River - Nigeria', isEthnical: true },
  // P
  { langId: 'adapt:PL',  code: 'PL',  aiName: 'Polish',           sign: '🇵🇱' },
  { langId: 'adapt:PA',  code: 'PA',  aiName: 'Punjabi',          sign: '🇮🇳', region: 'Punjab' },
  { langId: 'adapt:PT',  code: 'PT',  aiName: 'Portuguese',       sign: '🇵🇹' },
  // R
  { langId: 'adapt:RO',  code: 'RO',  aiName: 'Romanian',         sign: '🇷🇴' },
  { langId: 'adapt:RU',  code: 'RU',  aiName: 'Russian',          sign: '🇷🇺' },
  // S
  { langId: 'adapt:SA',  code: 'SA',  aiName: 'Sanskrit',         sign: '🕉️', region: 'Classical / Vedic', isEthnical: true },
  { langId: 'adapt:SR',  code: 'SR',  aiName: 'Serbian',          sign: '🇷🇸' },
  { langId: 'adapt:SK',  code: 'SK',  aiName: 'Slovak',           sign: '🇸🇰' },
  { langId: 'adapt:ES',  code: 'ES',  aiName: 'Spanish',          sign: '🇪🇸' },
  { langId: 'adapt:SW',  code: 'SW',  aiName: 'Swahili',          sign: '🇰🇪', region: 'Kenya / East Africa' },
  { langId: 'adapt:SV',  code: 'SV',  aiName: 'Swedish',          sign: '🇸🇪' },
  // T
  { langId: 'adapt:TL',  code: 'TL',  aiName: 'Tagalog',          sign: '🇵🇭' },
  { langId: 'adapt:TA',  code: 'TA',  aiName: 'Tamil',            sign: '🇮🇳', region: 'Tamil Nadu / Sri Lanka' },
  { langId: 'adapt:TE',  code: 'TE',  aiName: 'Telugu',           sign: '🇮🇳', region: 'Andhra Pradesh' },
  { langId: 'adapt:TH',  code: 'TH',  aiName: 'Thai',             sign: '🇹🇭' },
  { langId: 'adapt:TR',  code: 'TR',  aiName: 'Turkish',          sign: '🇹🇷' },
  // U
  { langId: 'adapt:UK',  code: 'UK',  aiName: 'Ukrainian',        sign: '🇺🇦' },
  { langId: 'adapt:UR',  code: 'UR',  aiName: 'Urdu',             sign: '🇵🇰' },
  { langId: 'adapt:UZ',  code: 'UZ',  aiName: 'Uzbek',            sign: '🇺🇿' },
  // V
  { langId: 'adapt:VI',  code: 'VI',  aiName: 'Vietnamese',       sign: '🇻🇳' },
  // W
  { langId: 'adapt:WO',  code: 'WO',  aiName: 'Wolof',            sign: '🦁', region: 'Senegal - West Africa', isEthnical: true },
  // Y
  { langId: 'adapt:YO',  code: 'YO',  aiName: 'Yoruba',           sign: '🎺', region: 'Nigeria - West Africa', isEthnical: true },
  // Z
  { langId: 'adapt:ZU',  code: 'ZU',  aiName: 'Zulu',             sign: '🛡️', region: 'South Africa', isEthnical: true },
] as const;

/**
 * Sentinel value used as the `value` prop in language selectors to indicate
 * the user wants to type a custom language name instead of picking from the list.
 * Never passed to the AI — components must substitute the user-typed text.
 */
export const CUSTOM_LANGUAGE_VALUE = '__custom__' as const;

/**
 * Returns true when the stored language value is the custom-language sentinel.
 */
export function isCustomAdaptationLanguage(value: string): boolean {
  return value === CUSTOM_LANGUAGE_VALUE;
}

/** Returns the formatted display label for use in dropdown menus. */
export function adaptationLanguageLabel(lang: AdaptationLanguage): string {
  return `${lang.sign} ${lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}`;
}

// ---------------------------------------------------------------------------
// langId resolution — single source of truth for sign + label lookup.
//
// ALL components must store lang.langId ("ui:fr", "adapt:AR") and resolve
// display metadata here at render time. Never persist sign/label strings.
//
// Migration: legacy bare codes ('fr', 'AR', 'French') are detected and
// promoted to their canonical langId automatically.
// ---------------------------------------------------------------------------

type LanguageDisplay = {
  label: string;
  sign: string;
  region?: string;
  isEthnical?: boolean;
};

/** Index keyed by langId ("ui:fr", "adapt:AR") — the authoritative lookup. */
const LANG_ID_INDEX = new Map<string, LanguageDisplay>();

/** Legacy fallback index keyed by normalised bare code/aiName for migration. */
const LEGACY_INDEX = new Map<string, string>(); // bare key → langId

const norm = (v: string) => v.trim().toLowerCase();

for (const locale of SUPPORTED_UI_LOCALES) {
  const display: LanguageDisplay = { label: locale.label, sign: locale.flag };
  LANG_ID_INDEX.set(locale.langId, display);
  // Legacy: bare BCP-47 lowercase code
  LEGACY_INDEX.set(norm(locale.code), locale.langId);
  // Legacy: native label
  LEGACY_INDEX.set(norm(locale.label), locale.langId);
}

for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
  const display: LanguageDisplay = {
    label: lang.aiName,
    sign: lang.sign,
    ...(lang.region !== undefined && { region: lang.region }),
    ...(lang.isEthnical !== undefined && { isEthnical: lang.isEthnical }),
  };
  LANG_ID_INDEX.set(lang.langId, display);
  // Legacy: uppercase code ('AR', 'HA', 'YUE') — always authoritative for adapt
  LEGACY_INDEX.set(lang.code, lang.langId);
  // Legacy: normalized lowercase code — only if not already claimed by UI locale
  const lcCode = norm(lang.code);
  if (!LEGACY_INDEX.has(lcCode)) {
    LEGACY_INDEX.set(lcCode, lang.langId);
  }
  // Legacy: aiName normalized — guard against overwriting UI locale entries
  // (e.g. adapt:EN/FR/ES/DE/PT share aiNames with ui:en/fr/es/de/pt labels).
  const lcName = norm(lang.aiName);
  if (!LEGACY_INDEX.has(lcName)) {
    LEGACY_INDEX.set(lcName, lang.langId);
  }
}

/**
 * Resolve any language reference to its display metadata.
 *
 * Accepts:
 *   - canonical langId  : "ui:fr"   → Français 🇫🇷
 *   - canonical langId  : "adapt:AR" → Arabic 🇸🇦
 *   - legacy bare code  : "fr", "AR", "HA"
 *   - legacy aiName     : "French", "Arabic"
 *
 * Components should pass lang.langId. The legacy path exists solely for
 * migration of persisted values and will be removed in a future cleanup.
 */
export function getLanguageDisplay(value: string): LanguageDisplay {
  const trimmed = value.trim();
  // 1. Custom free-input sentinel: "custom:<text>" — render as the typed text
  //    with a globe icon. Components must not need to know about the prefix.
  if (trimmed.startsWith(CUSTOM_LANG_ID_PREFIX)) {
    const text = trimmed.slice(CUSTOM_LANG_ID_PREFIX.length).trim();
    return { label: text || 'Custom', sign: '🌐' };
  }
  // 2. Try canonical langId directly
  const direct = LANG_ID_INDEX.get(trimmed);
  if (direct) return direct;
  // 3. Legacy: resolve bare code / aiName → langId → display
  const resolvedId = LEGACY_INDEX.get(trimmed) ?? LEGACY_INDEX.get(norm(trimmed));
  if (resolvedId) {
    const display = LANG_ID_INDEX.get(resolvedId);
    if (display) return display;
  }
  // 4. Unknown
  return { label: trimmed || 'Unknown', sign: '🌐' };
}

export function formatLanguageDisplay(value: string): string {
  const { label, sign } = getLanguageDisplay(value);
  return `${sign} ${label}`;
}

/**
 * Migrate a persisted bare language value to its canonical langId.
 * Call once on app init when reading from localStorage / any storage.
 *
 * Examples:
 *   migrateToLangId('fr')    → 'ui:fr'
 *   migrateToLangId('AR')    → 'adapt:AR'
 *   migrateToLangId('ui:fr') → 'ui:fr'  (no-op)
 */
export function migrateToLangId(stored: string): string {
  const trimmed = stored.trim();
  if (LANG_ID_INDEX.has(trimmed)) return trimmed; // already canonical
  const resolvedId = LEGACY_INDEX.get(trimmed) ?? LEGACY_INDEX.get(norm(trimmed));
  return resolvedId ?? trimmed;
}

/**
 * Extract the BCP-47 locale code from a UI langId for use with loadLocale.
 * Returns 'en' for any non-ui langId or unrecognised value.
 *
 * Example: langIdToLocaleCode('ui:fr') → 'fr'
 */
export function langIdToLocaleCode(langId: string): string {
  if (langId.startsWith('ui:')) return langId.slice(3);
  return 'en';
}

/**
 * Strip the internal `ui:` namespace prefix from a language identifier
 * before passing it to any BCP-47-validating API (Intl.*, toLocaleTimeString, etc.).
 *
 * Only the `ui:` prefix is stripped; all other values are returned unchanged
 * so that plain BCP-47 codes passed by callers are preserved as-is.
 *
 * Example: stripInternalPrefix('ui:en') → 'en'
 *          stripInternalPrefix('fr')    → 'fr'  (unchanged)
 */
export function stripInternalPrefix(code: string): string {
  return code.startsWith('ui:') ? code.slice(3) : code;
}

/**
 * Resolves a UI locale code (e.g. 'fr') to a language name suitable for
 * AI prompts that concern the *interface* language (e.g. "explain this in
 * Français"). Returns the locale's **native label** (e.g. 'Français'), NOT
 * the English aiName ('French').
 *
 * This is intentional: UI-language prompts mirror the user's own interface
 * language so the model can respond in kind. It is distinct from
 * `langIdToAiName`, which returns the English aiName used for lyric
 * adaptation targets (e.g. 'adapt:FR' → 'French').
 *
 * Falls back to 'English' for unknown codes.
 */
export function getUiLanguageNameForAi(code: string): string {
  const locale = SUPPORTED_UI_LOCALES.find(l => l.code === code);
  return locale?.label || 'English';
}

// ---------------------------------------------------------------------------
// LangId helpers — single canonical identifier for every language entry.
// ---------------------------------------------------------------------------

/** Index keyed by canonical adaptation langId for O(1) lookup. */
const ADAPT_LANG_BY_ID = new Map<string, AdaptationLanguage>();
for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
  ADAPT_LANG_BY_ID.set(lang.langId, lang);
}

/**
 * Lookup an adaptation language entry by its canonical `langId`.
 * Returns undefined if the langId is unknown (e.g. custom: sentinel or garbage).
 *
 * Typed as `AdaptationLangId` to surface TS errors at call-sites passing raw strings.
 */
export function getAdaptationLanguageByLangId(
  langId: AdaptationLangId,
): AdaptationLanguage | undefined {
  return ADAPT_LANG_BY_ID.get(langId);
}

/**
 * Returns true when the given value is a free-input custom-language sentinel
 * in the canonical `custom:<text>` form.
 *
 * NOTE: distinct from `isCustomAdaptationLanguage` (legacy `__custom__` UI
 * sentinel used by the dropdown's "Other language…" picker entry).
 */
export function isCustomLangId(value: string): boolean {
  return value.startsWith(CUSTOM_LANG_ID_PREFIX);
}

/**
 * Wrap a free-text adaptation language name into a `custom:<text>` langId.
 * The text is trimmed; whitespace-only inputs return undefined.
 */
export function buildCustomLangId(text: string): LangId | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return `${CUSTOM_LANG_ID_PREFIX}${trimmed}` as LangId;
}

/**
 * Extract the free-text portion from a `custom:<text>` langId.
 * Returns undefined for any non-custom value.
 */
export function readCustomLangText(value: string): string | undefined {
  if (!isCustomLangId(value)) return undefined;
  return value.slice(CUSTOM_LANG_ID_PREFIX.length);
}

/**
 * Resolve a langId to the language name string passed to the AI adaptation
 * prompt. This is the *only* sanctioned conversion point between the internal
 * langId wire format and the human-readable name fed to the model.
 *
 * Typed as `AdaptationLangId` on entry to surface TS errors at call-sites
 * passing raw strings without prior branding.
 *
 * - "adapt:<CODE>"   → entry.aiName (e.g. "adapt:ES" → "Spanish")
 * - "custom:<text>"  → text (verbatim, trimmed)
 * - "ui:<code>"      → ui locale label (e.g. "ui:fr" → "Français")
 * - legacy bare value → resolved via `migrateToLangId`, then recurses
 * - unknown          → the trimmed input itself (preserves legacy free-form)
 */
export function langIdToAiName(value: AdaptationLangId): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  // Custom free-input sentinel.
  const customText = readCustomLangText(trimmed);
  if (customText !== undefined) return customText.trim();
  // Canonical adaptation langId.
  const adapt = ADAPT_LANG_BY_ID.get(trimmed);
  if (adapt) return adapt.aiName;
  // Canonical UI langId.
  if (trimmed.startsWith('ui:')) {
    const locale = SUPPORTED_UI_LOCALES.find(l => l.langId === trimmed);
    if (locale) return locale.label;
  }
  // Legacy: try to upgrade then resolve once.
  const upgraded = migrateToLangId(trimmed);
  if (upgraded !== trimmed) {
    const adapt2 = ADAPT_LANG_BY_ID.get(upgraded);
    if (adapt2) return adapt2.aiName;
    if (upgraded.startsWith('ui:')) {
      const locale = SUPPORTED_UI_LOCALES.find(l => l.langId === upgraded);
      if (locale) return locale.label;
    }
  }
  return trimmed;
}

/**
 * Migrate any persisted/legacy adaptation-language reference to a canonical
 * langId form suitable for storage and transport. Free-text entries that
 * don't match a known language are wrapped in the `custom:` sentinel so the
 * resolver pipeline can always tell them apart from canonical entries.
 *
 * Priority order (each step short-circuits):
 *   1. Empty string → preserved as-is.
 *   2. `custom:*` sentinel → preserved as-is.
 *   3. Already a canonical `adapt:` langId → no-op.
 *   4. Direct match by code or normalized aiName in SUPPORTED_ADAPTATION_LANGUAGES
 *      (takes priority over LEGACY_INDEX to prevent adapt:EN/FR/ES/DE/PT
 *      from resolving to their ui: counterparts due to aiName collisions).
 *   5. Last resort: LEGACY_INDEX — only accepted when the resolved id starts
 *      with `adapt:` AND is a known entry. `ui:` results are rejected here
 *      to prevent namespace leakage.
 *   6. Unknown free text → wrapped as `custom:<text>` sentinel.
 *
 * Examples:
 *   migrateAdaptationToLangId('Spanish')      → 'adapt:ES'
 *   migrateAdaptationToLangId('adapt:ES')     → 'adapt:ES'
 *   migrateAdaptationToLangId('Scots Gaelic') → 'custom:Scots Gaelic'
 *   migrateAdaptationToLangId('')             → ''  (empty preserved)
 */
export function migrateAdaptationToLangId(stored: string): string {
  const trimmed = stored.trim();
  if (!trimmed) return '';
  // Step 2: Already a custom sentinel — preserve as-is.
  if (isCustomLangId(trimmed)) return trimmed;
  // Step 3: Already a canonical adapt: langId.
  if (ADAPT_LANG_BY_ID.has(trimmed)) return trimmed;
  // Step 4: Search adaptation table directly by uppercase code or normalized aiName.
  // This takes priority over the shared LEGACY_INDEX to prevent adapt:FR/EN/ES/
  // DE/PT from resolving to ui:fr/en/es/de/pt (same aiName, different namespace).
  const normed = norm(trimmed);
  const byDirect = SUPPORTED_ADAPTATION_LANGUAGES.find(
    l => l.code === trimmed ||
         l.code === trimmed.toUpperCase() ||
         norm(l.aiName) === normed ||
         norm(l.code) === normed
  );
  if (byDirect) return byDirect.langId;
  // Step 5: Legacy resolver — strictly adapt: namespace only.
  // Reject ui: results to prevent namespace leakage (e.g. 'french' must not
  // resolve to 'ui:fr' in the adaptation pipeline).
  if (!trimmed.startsWith('ui:') && !trimmed.startsWith('adapt:')) {
    const upgraded = migrateToLangId(trimmed);
    if (upgraded !== trimmed && upgraded.startsWith('adapt:') && ADAPT_LANG_BY_ID.has(upgraded)) {
      return upgraded;
    }
  }
  // Step 6: Unknown free text → wrap as custom sentinel so resolvers stay consistent.
  return `${CUSTOM_LANG_ID_PREFIX}${trimmed}`;
}

/**
 * asLangId — runtime-validated narrowing from string to LangId brand.
 * Throws if the value is not a recognised canonical langId.
 * Use migrateToLangId() first when the source may be legacy.
 */
export function asLangId(value: string): LangId {
  if (LANG_ID_INDEX.has(value)) return value as LangId;
  throw new Error(`asLangId: unknown langId "${value}"`);
}

/**
 * Locale completeness validation.
 *
 * Import `validateLocales()` in a test or dev tool to detect untranslated /
 * missing keys across all locale files compared to the English baseline.
 *
 * @example
 * import { validateLocales } from './i18n/validateLocales';
 * const report = await validateLocales();
 * // { fr: { missing: ['about.engineLabel'], extra: [] }, ... }
 */

import type { Translations } from './locales/types';

// Lazy-load all locale files on-demand
const _localeLoaders = import.meta.glob<Translations>(
  './locales/*.json',
  { import: 'default' },
);

// Cache for loaded locales
const _localeCache: Record<string, Translations> = {};

// Async function to load all locales
async function loadAllLocales(): Promise<Record<string, Translations>> {
  const allLocales: Record<string, Translations> = {};

  for (const [path, loader] of Object.entries(_localeLoaders)) {
    const match = path.match(/\/([A-Za-z0-9-]+)\.json$/);
    if (match?.[1]) {
      const code = match[1].toLowerCase();
      if (_localeCache[code]) {
        allLocales[code] = _localeCache[code];
      } else {
        try {
          const locale = await loader();
          _localeCache[code] = locale;
          allLocales[code] = locale;
        } catch (error) {
          console.error(`[i18n] Failed to load locale '${code}':`, error);
        }
      }
    }
  }

  return allLocales;
}

/** Recursively collect all dot-separated keys from an object. */
function collectKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

export interface LocaleValidationResult {
  /** Keys present in English but absent in this locale */
  missing: string[];
  /** Keys present in this locale but absent in English (usually old/renamed keys) */
  extra: string[];
}

/**
 * Returns a report of missing and extra keys per locale.
 * An empty object means all locales are complete.
 */
/** Keys that are structural metadata and should not be treated as translation keys. */
const METADATA_KEYS = new Set(['_meta']);

export async function validateLocales(): Promise<Record<string, LocaleValidationResult>> {
  const allLocales = await loadAllLocales();

  const en = allLocales['en'];
  if (!en || Object.keys(en).length === 0) {
    throw new Error('[i18n] en.json is missing or empty – cannot validate locales.');
  }

  const BASE_KEYS = new Set(collectKeys(en));
  const report: Record<string, LocaleValidationResult> = {};

  for (const [code, locale] of Object.entries(allLocales)) {
    if (code === 'en') continue;

    const localeKeys = new Set(collectKeys(locale));
    const missing = [...BASE_KEYS].filter(k => !localeKeys.has(k));
    const extra   = [...localeKeys].filter(k => !BASE_KEYS.has(k) && !METADATA_KEYS.has(k));

    if (missing.length > 0 || extra.length > 0) {
      report[code] = { missing, extra };
    }
  }

  return report;
}

/** Returns `true` when every locale has exactly the same keys as English. */
export async function areLocalesComplete(): Promise<boolean> {
  const report = await validateLocales();
  return Object.keys(report).length === 0;
}

/** Log a human-readable report to the console (useful in dev). */
export async function printLocaleReport(): Promise<void> {
  const report = await validateLocales();
  if (Object.keys(report).length === 0) {
    console.log('✅ All locales are complete.');
    return;
  }
  for (const [code, { missing, extra }] of Object.entries(report)) {
    if (missing.length > 0) {
      console.warn(`[i18n] ${code} – missing ${missing.length} key(s):`, missing);
    }
    if (extra.length > 0) {
      console.info(`[i18n] ${code} – ${extra.length} extra/obsolete key(s):`, extra);
    }
  }
}

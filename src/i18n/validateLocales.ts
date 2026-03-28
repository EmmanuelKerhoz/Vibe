/**
 * Locale completeness validation.
 *
 * Import `validateLocales()` in a test or dev tool to detect untranslated /
 * missing keys across all locale files compared to the English baseline.
 *
 * @example
 * import { validateLocales } from './i18n/validateLocales';
 * const report = validateLocales();
 * // { fr: { missing: ['about.engineLabel'], extra: [] }, ... }
 */

import type { Translations } from './locales/types';

// Load all locale JSON glossary files via Vite glob import (same mechanism as LanguageProvider).
const _localeModules = import.meta.glob<Translations>(
  './locales/*.json',
  { eager: true, import: 'default' },
);

const _en: Translations = _localeModules['./locales/en.json'] ?? ({} as Translations);

const ALL_LOCALES: Record<string, Translations> = {};
for (const [path, locale] of Object.entries(_localeModules)) {
  const match = path.match(/\/([a-z]+)\.json$/i);
  if (match?.[1] && match[1] !== 'en') {
    ALL_LOCALES[match[1]] = locale;
  }
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

const BASE_KEYS = new Set(collectKeys(_en));

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

export function validateLocales(): Record<string, LocaleValidationResult> {
  const report: Record<string, LocaleValidationResult> = {};

  for (const [code, locale] of Object.entries(ALL_LOCALES)) {
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
export function areLocalesComplete(): boolean {
  const report = validateLocales();
  return Object.keys(report).length === 0;
}

/** Log a human-readable report to the console (useful in dev). */
export function printLocaleReport(): void {
  const report = validateLocales();
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

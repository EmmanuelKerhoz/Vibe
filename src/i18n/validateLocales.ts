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

import en from './locales/en';
import fr from './locales/fr';
import es from './locales/es';
import de from './locales/de';
import pt from './locales/pt';
import ar from './locales/ar';
import zh from './locales/zh';
import type { Translations } from './locales/types';

/** Recursively collect all dot-separated keys from an object. */
function collectKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

const ALL_LOCALES: Record<string, Translations> = { fr, es, de, pt, ar, zh };
const BASE_KEYS = new Set(collectKeys(en));

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

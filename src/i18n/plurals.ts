import { stripInternalPrefix } from './constants';

/**
 * Returns the correctly pluralised label for a given count using Intl.PluralRules.
 *
 * Keys are looked up as `${baseKey}_${form}` where `form` is one of the
 * CLDR plural categories: zero, one, two, few, many, other.
 * Falls back to `dict[baseKey]` when the specific form is not defined.
 *
 * @example
 * tPlural(t.statusBar, 'sections', 1, 'fr') // "Section"
 * tPlural(t.statusBar, 'sections', 2, 'fr') // "Sections"
 */
export function tPlural(
  dict: Record<string, string | undefined>,
  baseKey: string,
  count: number,
  language: string,
): string {
  // Strip the internal `ui:` namespace prefix (e.g. "ui:en" → "en") before
  // passing to Intl.PluralRules which validates BCP-47 tags.
  // Guard: fall back to 'en' if the result is empty or otherwise invalid to
  // prevent a RangeError crash from Intl.PluralRules('').
  const stripped = stripInternalPrefix(language);
  const bcp47 = stripped.length > 0 ? stripped : 'en';
  const form = new Intl.PluralRules(bcp47).select(count);
  return dict[`${baseKey}_${form}`] ?? dict[baseKey] ?? baseKey;
}

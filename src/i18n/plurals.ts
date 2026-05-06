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
  const bcp47 = language.startsWith('ui:') ? language.slice(3) : language;
  const form = new Intl.PluralRules(bcp47).select(count);
  return dict[`${baseKey}_${form}`] ?? dict[baseKey] ?? baseKey;
}

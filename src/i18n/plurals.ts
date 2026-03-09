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
  const form = new Intl.PluralRules(language).select(count);
  return dict[`${baseKey}_${form}`] ?? dict[baseKey] ?? baseKey;
}

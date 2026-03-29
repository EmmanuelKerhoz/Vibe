import { describe, expect, it } from 'vitest';
import { validateLocales } from './validateLocales';

describe('validateLocales', () => {
  it('reports no missing syllableCount keys across supported locales', async () => {
    const report = await validateLocales();
    const localesMissingSyllableCount = Object.entries(report)
      .filter(([, result]) => result.missing.includes('editor.syllableCount'))
      .map(([locale]) => locale);

    expect(localesMissingSyllableCount).toEqual([]);
  });

  it('reports no missing mobile navigation keys across supported locales', async () => {
    const report = await validateLocales();
    const localesMissingMobileNav = Object.entries(report)
      .filter(([, result]) => result.missing.some(key => key.startsWith('mobileNav.')))
      .map(([locale]) => locale);

    expect(localesMissingMobileNav).toEqual([]);
  });
});

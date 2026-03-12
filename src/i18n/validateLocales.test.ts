import { describe, expect, it } from 'vitest';
import { validateLocales } from './validateLocales';

describe('validateLocales', () => {
  it('reports no missing syllableCount keys across supported locales', () => {
    const report = validateLocales();
    const localesMissingSyllableCount = Object.entries(report)
      .filter(([, result]) => result.missing.includes('editor.syllableCount'))
      .map(([locale]) => locale);

    expect(localesMissingSyllableCount).toEqual([]);
  });
});

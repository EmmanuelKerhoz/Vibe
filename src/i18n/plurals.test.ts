import { describe, expect, it } from 'vitest';
import { tPlural } from './plurals';

const dict: Record<string, string | undefined> = {
  sections: 'section',
  sections_one: 'section',
  sections_other: 'sections',
};

describe('tPlural', () => {
  it('selects singular for count 1 (plain BCP-47 code)', () => {
    expect(tPlural(dict, 'sections', 1, 'en')).toBe('section');
  });

  it('selects plural for count 2 (plain BCP-47 code)', () => {
    expect(tPlural(dict, 'sections', 2, 'en')).toBe('sections');
  });

  it('does not throw when passed a ui:-prefixed langId', () => {
    expect(() => tPlural(dict, 'sections', 1, 'ui:en')).not.toThrow();
  });

  it('returns correct form when passed a ui:-prefixed langId', () => {
    expect(tPlural(dict, 'sections', 1, 'ui:en')).toBe('section');
    expect(tPlural(dict, 'sections', 2, 'ui:en')).toBe('sections');
  });

  it('returns correct form for French ui:-prefixed langId', () => {
    expect(tPlural(dict, 'sections', 1, 'ui:fr')).toBe('section');
    expect(tPlural(dict, 'sections', 2, 'ui:fr')).toBe('sections');
  });

  it('falls back to base key when form-specific key is missing', () => {
    const partialDict: Record<string, string | undefined> = { sections: 'section(s)' };
    expect(tPlural(partialDict, 'sections', 2, 'ui:en')).toBe('section(s)');
  });

  it('falls back to baseKey string when neither form nor base key exists', () => {
    expect(tPlural({}, 'missing_key', 1, 'ui:en')).toBe('missing_key');
  });
});

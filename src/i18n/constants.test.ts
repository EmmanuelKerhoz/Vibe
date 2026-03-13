import { describe, expect, it } from 'vitest';
import { SUPPORTED_ADAPTATION_LANGUAGES, getLanguageDisplay } from './constants';

describe('adaptation language dialects', () => {
  it('includes Nigerian Bekwarra and Togolese Mina', () => {
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'BK', aiName: 'Bekwarra', region: 'Nigeria - Cross River' }),
      expect.objectContaining({ code: 'MI', aiName: 'Mina', region: 'Togo - Maritime Region' }),
    ]));
  });

  it('exposes Bekwarra and Mina through display lookups', () => {
    expect(getLanguageDisplay('BK')).toMatchObject({ label: 'Bekwarra', sign: '🪘' });
    expect(getLanguageDisplay('Mina')).toMatchObject({ label: 'Mina', sign: '🪘' });
  });
});

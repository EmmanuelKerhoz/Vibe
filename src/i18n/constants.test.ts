import { describe, expect, it } from 'vitest';
import { SUPPORTED_ADAPTATION_LANGUAGES, SUPPORTED_UI_LOCALES, getLanguageDisplay } from './constants';

describe('adaptation language dialects', () => {
  it('includes Nigerian Bekwarra and Togolese dialects Mina and Ewe', () => {
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'BK', aiName: 'Bekwarra', region: 'Nigeria - Cross River' }),
      expect.objectContaining({ code: 'MI', aiName: 'Mina', region: 'Togo - Maritime Region' }),
      expect.objectContaining({ code: 'EW', aiName: 'Ewe', region: 'Togo - Volta Region' }),
    ]));
  });

  it('exposes Bekwarra, Mina, Ewe, and Korean through display lookups', () => {
    expect(getLanguageDisplay('BK')).toMatchObject({ label: 'Bekwarra', sign: '🏹' });
    expect(getLanguageDisplay('Mina')).toMatchObject({ label: 'Mina', sign: '🌊' });
    expect(getLanguageDisplay('EW')).toMatchObject({ label: 'Ewe', sign: '🎶' });
    expect(getLanguageDisplay('ko')).toMatchObject({ label: '한국어', sign: '🇰🇷' });
  });

  it('includes Korean in supported UI locales', () => {
    expect(SUPPORTED_UI_LOCALES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ko', label: '한국어', flag: '🇰🇷', dir: 'ltr' }),
    ]));
  });
});

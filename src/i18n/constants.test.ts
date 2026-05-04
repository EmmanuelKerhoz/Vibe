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
    expect(getLanguageDisplay('EW')).toMatchObject({ label: 'Ewe', sign: '🪘' });
    expect(getLanguageDisplay('ko')).toMatchObject({ label: '한국어', sign: '🇰🇷' });
  });

  it('offers Sanskrit for adaptation and display lookups', () => {
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'SA', aiName: 'Sanskrit', sign: '🕉️' }),
    ]));
    expect(getLanguageDisplay('SA')).toMatchObject({ label: 'Sanskrit', sign: '🕉️' });
    expect(getLanguageDisplay('Sanskrit')).toMatchObject({ label: 'Sanskrit', sign: '🕉️' });
  });

  it('includes Korean in supported UI locales', () => {
    expect(SUPPORTED_UI_LOCALES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ko', label: '한국어', flag: '🇰🇷', dir: 'ltr' }),
    ]));
  });

  it('applies Feature 4 language flag corrections', () => {
    // English: keeps 🇬🇧, gains region: 'United Kingdom'
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'EN', sign: '🇬🇧', region: 'United Kingdom' }),
    ]));

    // Swahili: changed to 🌍 with isEthnical: true
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'SW', sign: '🌍', isEthnical: true }),
    ]));

    // Kannada: region updated to 'Karnataka - South India'
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'KN', region: 'Karnataka - South India' }),
    ]));

    // Nigerian Pidgin: isEthnical removed (flag stays 🇳🇬)
    const pcm = SUPPORTED_ADAPTATION_LANGUAGES.find(l => l.code === 'PCM');
    expect(pcm?.isEthnical).not.toBe(true);
    expect(pcm?.sign).toBe('🇳🇬');

    // Nouchi: isEthnical removed (flag stays 🇨🇮)
    const nou = SUPPORTED_ADAPTATION_LANGUAGES.find(l => l.code === 'NOU');
    expect(nou?.isEthnical).not.toBe(true);
    expect(nou?.sign).toBe('🇨🇮');

    // Camfranglais: isEthnical removed (flag stays 🇨🇲)
    const cfg = SUPPORTED_ADAPTATION_LANGUAGES.find(l => l.code === 'CFG');
    expect(cfg?.isEthnical).not.toBe(true);
    expect(cfg?.sign).toBe('🇨🇲');

    // Ewe: changed from 🎶 to 🪘
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'EW', sign: '🪘', isEthnical: true }),
    ]));

    // Arabic: changed to 🌙 with isEthnical: true, region: 'Arab World'
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'AR', sign: '🌙', isEthnical: true, region: 'Arab World' }),
    ]));

    // Farsi: unchanged (keeps 🇮🇷)
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'FA', sign: '🇮🇷' }),
    ]));
  });

  it('enforces picto uniqueness: no two isEthnical entries share the same sign', () => {
    const ethnicalEntries = SUPPORTED_ADAPTATION_LANGUAGES.filter(l => l.isEthnical === true);
    const signs = ethnicalEntries.map(l => l.sign);
    const uniqueSigns = new Set(signs);
    expect(uniqueSigns.size).toBe(signs.length);
  });
});

import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_ADAPTATION_LANGUAGES,
  SUPPORTED_UI_LOCALES,
  getLanguageDisplay,
  migrateToLangId,
  langIdToLocaleCode,
} from './constants';

describe('langId — stable identifier', () => {
  it('every UI locale has a langId in "ui:<code>" format', () => {
    for (const locale of SUPPORTED_UI_LOCALES) {
      expect(locale.langId).toBe(`ui:${locale.code}`);
    }
  });

  it('every adaptation language has a langId in "adapt:<CODE>" format', () => {
    for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
      expect(lang.langId).toBe(`adapt:${lang.code}`);
    }
  });

  it('migrateToLangId: upgrades legacy bare codes to canonical langId', () => {
    expect(migrateToLangId('fr')).toBe('ui:fr');
    expect(migrateToLangId('AR')).toBe('adapt:AR');
    expect(migrateToLangId('HA')).toBe('adapt:HA');
    expect(migrateToLangId('SW')).toBe('adapt:SW');
    expect(migrateToLangId('ko')).toBe('ui:ko');
  });

  it('migrateToLangId: canonical langIds are no-ops', () => {
    expect(migrateToLangId('ui:fr')).toBe('ui:fr');
    expect(migrateToLangId('adapt:AR')).toBe('adapt:AR');
  });

  it('langIdToLocaleCode extracts BCP-47 code from ui langId', () => {
    expect(langIdToLocaleCode('ui:fr')).toBe('fr');
    expect(langIdToLocaleCode('ui:ar')).toBe('ar');
    expect(langIdToLocaleCode('adapt:AR')).toBe('en'); // not a UI locale
    expect(langIdToLocaleCode('garbage')).toBe('en');
  });
});

describe('getLanguageDisplay — sign + label resolution', () => {
  it('resolves canonical UI langId', () => {
    expect(getLanguageDisplay('ui:fr')).toMatchObject({ label: 'Français', sign: '🇫🇷' });
    expect(getLanguageDisplay('ui:ar')).toMatchObject({ label: 'العربية', sign: '🇸🇦' });
    expect(getLanguageDisplay('ui:ko')).toMatchObject({ label: '한국어', sign: '🇰🇷' });
  });

  it('resolves canonical adapt langId', () => {
    expect(getLanguageDisplay('adapt:AR')).toMatchObject({ label: 'Arabic', sign: '🌙' });
    expect(getLanguageDisplay('adapt:HA')).toMatchObject({ label: 'Hausa', sign: '🇳🇬' });
    expect(getLanguageDisplay('adapt:SW')).toMatchObject({ label: 'Swahili', sign: '🌍' });
    expect(getLanguageDisplay('adapt:SA')).toMatchObject({ label: 'Sanskrit', sign: '🕉️' });
  });

  it('resolves legacy bare uppercase codes (migration path)', () => {
    expect(getLanguageDisplay('AR')).toMatchObject({ label: 'Arabic', sign: '🌙' });
    expect(getLanguageDisplay('HA')).toMatchObject({ label: 'Hausa', sign: '🇳🇬' });
    expect(getLanguageDisplay('SW')).toMatchObject({ label: 'Swahili', sign: '🌍' });
    expect(getLanguageDisplay('BK')).toMatchObject({ label: 'Bekwarra', sign: '🏹' });
    expect(getLanguageDisplay('EW')).toMatchObject({ label: 'Ewe', sign: '🪘' });
  });

  it('resolves legacy bare lowercase UI codes (migration path)', () => {
    expect(getLanguageDisplay('fr')).toMatchObject({ label: 'Français', sign: '🇫🇷' });
    expect(getLanguageDisplay('ko')).toMatchObject({ label: '한국어', sign: '🇰🇷' });
  });

  it('resolves legacy aiName strings (migration path)', () => {
    expect(getLanguageDisplay('French')).toMatchObject({ label: 'French', sign: '🇫🇷' });
    expect(getLanguageDisplay('Arabic')).toMatchObject({ label: 'Arabic', sign: '🌙' });
    expect(getLanguageDisplay('Sanskrit')).toMatchObject({ label: 'Sanskrit', sign: '🕉️' });
    expect(getLanguageDisplay('Mina')).toMatchObject({ label: 'Mina', sign: '🌊' });
  });

  it('returns globe fallback for unknown values', () => {
    expect(getLanguageDisplay('__garbage__')).toMatchObject({ sign: '🌐' });
  });
});

describe('adaptation language dialects', () => {
  it('includes Nigerian Bekwarra and Togolese dialects Mina and Ewe', () => {
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'BK', aiName: 'Bekwarra', region: 'Nigeria - Cross River' }),
      expect.objectContaining({ code: 'MI', aiName: 'Mina', region: 'Togo - Maritime Region' }),
      expect.objectContaining({ code: 'EW', aiName: 'Ewe', region: 'Togo - Volta Region' }),
    ]));
  });

  it('offers Sanskrit for adaptation and display lookups', () => {
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'SA', aiName: 'Sanskrit', sign: '🕉️' }),
    ]));
  });

  it('includes Korean in supported UI locales', () => {
    expect(SUPPORTED_UI_LOCALES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ko', label: '한국어', flag: '🇰🇷', dir: 'ltr' }),
    ]));
  });

  it('flag corrections: AR=🌙 isEthnical, SW=🌍 isEthnical, HA=🇳🇬', () => {
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'AR', sign: '🌙', isEthnical: true, region: 'Arab World' }),
      expect.objectContaining({ code: 'SW', sign: '🌍', isEthnical: true }),
      expect.objectContaining({ code: 'HA', sign: '🇳🇬' }),
      expect.objectContaining({ code: 'EN', sign: '🇺🇸', region: 'United States' }),
      expect.objectContaining({ code: 'KN', region: 'Karnataka - South India' }),
      expect.objectContaining({ code: 'EW', sign: '🪘', isEthnical: true }),
      expect.objectContaining({ code: 'FA', sign: '🇮🇷' }),
    ]));
    const pcm = SUPPORTED_ADAPTATION_LANGUAGES.find(l => l.code === 'PCM');
    expect(pcm?.isEthnical).not.toBe(true);
    const nou = SUPPORTED_ADAPTATION_LANGUAGES.find(l => l.code === 'NOU');
    expect(nou?.isEthnical).not.toBe(true);
    const cfg = SUPPORTED_ADAPTATION_LANGUAGES.find(l => l.code === 'CFG');
    expect(cfg?.isEthnical).not.toBe(true);
  });

  it('enforces picto uniqueness: no two isEthnical entries share the same sign', () => {
    const ethnical = SUPPORTED_ADAPTATION_LANGUAGES.filter(l => l.isEthnical === true);
    const signs = ethnical.map(l => l.sign);
    expect(new Set(signs).size).toBe(signs.length);
  });

  it('keeps English and French unique in UI locales', () => {
    expect(SUPPORTED_UI_LOCALES.filter(l => l.label === 'English')).toEqual([
      expect.objectContaining({ code: 'en', flag: '🇺🇸' }),
    ]);
    expect(SUPPORTED_UI_LOCALES.filter(l => l.label === 'Français')).toEqual([
      expect.objectContaining({ code: 'fr', flag: '🇫🇷' }),
    ]);
  });

  it('keeps English and French unique in adaptation languages', () => {
    expect(SUPPORTED_ADAPTATION_LANGUAGES.filter(l => l.aiName === 'English')).toEqual([
      expect.objectContaining({ code: 'EN', sign: '🇺🇸' }),
    ]);
    expect(SUPPORTED_ADAPTATION_LANGUAGES.filter(l => l.aiName === 'French')).toEqual([
      expect.objectContaining({ code: 'FR', sign: '🇫🇷' }),
    ]);
  });
});

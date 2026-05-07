import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_ADAPTATION_LANGUAGES,
  SUPPORTED_UI_LOCALES,
  getLanguageDisplay,
  migrateToLangId,
  langIdToLocaleCode,
  stripInternalPrefix,
  langIdToAiName,
  migrateAdaptationToLangId,
  buildCustomLangId,
  isCustomLangId,
  readCustomLangText,
  getAdaptationLanguageByLangId,
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

  it('stripInternalPrefix strips ui: prefix and leaves other values unchanged', () => {
    expect(stripInternalPrefix('ui:en')).toBe('en');
    expect(stripInternalPrefix('ui:fr')).toBe('fr');
    expect(stripInternalPrefix('ui:ar')).toBe('ar');
    expect(stripInternalPrefix('fr')).toBe('fr');
    expect(stripInternalPrefix('en')).toBe('en');
    expect(stripInternalPrefix('adapt:AR')).toBe('adapt:AR');
  });

  it('stripInternalPrefix: stripped value is a valid BCP-47 tag for Intl.PluralRules', () => {
    for (const locale of SUPPORTED_UI_LOCALES) {
      const stripped = stripInternalPrefix(locale.langId);
      expect(() => new Intl.PluralRules(stripped)).not.toThrow();
    }
  });
});

describe('getLanguageDisplay — sign + label resolution', () => {
  it('resolves canonical UI langId', () => {
    expect(getLanguageDisplay('ui:fr')).toMatchObject({ label: 'Français', sign: '🇫🇷' });
    expect(getLanguageDisplay('ui:ar')).toMatchObject({ label: 'العربية', sign: '🇸🇦' });
    expect(getLanguageDisplay('ui:ko')).toMatchObject({ label: '한국어', sign: '🇰🇷' });
  });

  it('resolves canonical adapt langId', () => {
    expect(getLanguageDisplay('adapt:AR')).toMatchObject({ label: 'Arabic', sign: '🇸🇦' });
    expect(getLanguageDisplay('adapt:HA')).toMatchObject({ label: 'Hausa', sign: '🇳🇬' });
    expect(getLanguageDisplay('adapt:SW')).toMatchObject({ label: 'Swahili', sign: '🇰🇪' });
    expect(getLanguageDisplay('adapt:SA')).toMatchObject({ label: 'Sanskrit', sign: '🕉️' });
  });

  it('resolves legacy bare uppercase codes (migration path)', () => {
    expect(getLanguageDisplay('AR')).toMatchObject({ label: 'Arabic', sign: '🇸🇦' });
    expect(getLanguageDisplay('HA')).toMatchObject({ label: 'Hausa', sign: '🇳🇬' });
    expect(getLanguageDisplay('SW')).toMatchObject({ label: 'Swahili', sign: '🇰🇪' });
    expect(getLanguageDisplay('BK')).toMatchObject({ label: 'Bekwarra', sign: '🏹' });
    expect(getLanguageDisplay('EW')).toMatchObject({ label: 'Ewe', sign: '🪘' });
  });

  it('resolves legacy bare lowercase UI codes (migration path)', () => {
    expect(getLanguageDisplay('fr')).toMatchObject({ label: 'Français', sign: '🇫🇷' });
    expect(getLanguageDisplay('ko')).toMatchObject({ label: '한국어', sign: '🇰🇷' });
  });

  it('resolves legacy aiName strings (migration path)', () => {
    expect(getLanguageDisplay('French')).toMatchObject({ label: 'French', sign: '🇫🇷' });
    expect(getLanguageDisplay('Arabic')).toMatchObject({ label: 'Arabic', sign: '🇸🇦' });
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

  it('flag/region invariants for canonical national entries', () => {
    expect(SUPPORTED_ADAPTATION_LANGUAGES).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'AR', sign: '🇸🇦', region: 'Arab World' }),
      expect.objectContaining({ code: 'SW', sign: '🇰🇪' }),
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

// ---------------------------------------------------------------------------
// Structural invariants — these guarantee that "Spanish wears the German flag"
// class of bug cannot happen at the data-table layer. The tests are computed,
// not hand-typed, so the rules apply automatically to every new entry.
// ---------------------------------------------------------------------------

/**
 * Convert a 2-letter ISO-3166-1 country code into the regional-indicator
 * pair that renders as that country's flag emoji (e.g. "ES" → "🇪🇸").
 */
function countryCodeToFlag(code: string): string {
  const A = 0x1F1E6; // regional indicator A
  const c0 = code.charCodeAt(0) - 'A'.charCodeAt(0);
  const c1 = code.charCodeAt(1) - 'A'.charCodeAt(0);
  return String.fromCodePoint(A + c0) + String.fromCodePoint(A + c1);
}

/**
 * Map of adaptation `code` → expected ISO-3166 country whose flag must appear
 * in `sign`. Only entries whose `code` itself IS a country alpha-2 are listed
 * verbatim; other entries are re-keyed to the country implied by the language.
 *
 * The list deliberately excludes ethnical entries (no national flag) and
 * dialects keyed to a parent country (e.g. KN/PA/TE/TA → 🇮🇳 covered separately).
 */
const EXPECTED_NATIONAL_FLAG: Record<string, string> = {
  // entries where the lang code IS a country code
  AR: 'SA', AZ: 'AZ', BG: 'BG', BN: 'BD', CS: 'CZ', DA: 'DK', DE: 'DE',
  EN: 'US', ES: 'ES', ET: 'EE', FA: 'IR', FI: 'FI', FR: 'FR', HE: 'IL',
  HI: 'IN', HR: 'HR', HU: 'HU', ID: 'ID', IS: 'IS', IT: 'IT', JA: 'JP',
  KK: 'KZ', KM: 'KH', KO: 'KR', LO: 'LA', MS: 'MY', NL: 'NL', NO: 'NO',
  PL: 'PL', PT: 'PT', RO: 'RO', RU: 'RU', SK: 'SK', SR: 'RS', SV: 'SE',
  SW: 'KE', TH: 'TH', TL: 'PH', TR: 'TR', UK: 'UA', UR: 'PK', UZ: 'UZ',
  VI: 'VN', YUE: 'HK', ZH: 'CN',
  // language code differs from country code
  HA: 'NG', PCM: 'NG', NOU: 'CI', CFG: 'CM', AM: 'ET',
  // dialects keyed to parent country
  KN: 'IN', ML: 'IN', PA: 'IN', TA: 'IN', TE: 'IN',
};

/** Regional-indicator surrogate-pair pattern: matches any 🇦🇦…🇿🇿 flag emoji. */
const REGIONAL_INDICATOR_PAIR_RE = /^[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]$/;

describe('ISO-3166 flag↔language invariants (computed, not hand-typed)', () => {
  it('every national entry shows the regional-indicator pair derived from its country code', () => {
    for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
      const country = EXPECTED_NATIONAL_FLAG[lang.code];
      if (!country) continue; // ethnical or unmapped — covered by other tests
      const expected = countryCodeToFlag(country);
      expect(
        lang.sign,
        `${lang.code} (${lang.aiName}) must wear ${country}'s flag ${expected}`,
      ).toBe(expected);
    }
  });

  it('every ethnical entry uses a non-flag pictogram (never a country flag)', () => {
    for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
      if (lang.isEthnical !== true) continue;
      expect(
        REGIONAL_INDICATOR_PAIR_RE.test(lang.sign),
        `${lang.code} (${lang.aiName}) is ethnical and must NOT use a country flag (got "${lang.sign}")`,
      ).toBe(false);
    }
  });

  it('round-trip: getLanguageDisplay(langId).sign === SUPPORTED_*[langId].sign for every entry', () => {
    for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
      expect(getLanguageDisplay(lang.langId).sign).toBe(lang.sign);
      expect(getLanguageDisplay(lang.langId).label).toBe(lang.aiName);
    }
    for (const locale of SUPPORTED_UI_LOCALES) {
      expect(getLanguageDisplay(locale.langId).sign).toBe(locale.flag);
      expect(getLanguageDisplay(locale.langId).label).toBe(locale.label);
    }
  });

  it('langId is unique across both UI locales and adaptation entries', () => {
    const all = [
      ...SUPPORTED_UI_LOCALES.map(l => l.langId),
      ...SUPPORTED_ADAPTATION_LANGUAGES.map(l => l.langId),
    ];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('langIdToAiName — single conversion point for AI prompts', () => {
  it('resolves canonical adaptation langIds to aiName', () => {
    expect(langIdToAiName('adapt:ES')).toBe('Spanish');
    expect(langIdToAiName('adapt:FR')).toBe('French');
    expect(langIdToAiName('adapt:RO')).toBe('Romanian');
    expect(langIdToAiName('adapt:PT')).toBe('Portuguese');
  });

  it('returns the trimmed text for custom: sentinels', () => {
    expect(langIdToAiName('custom:Scots Gaelic')).toBe('Scots Gaelic');
    expect(langIdToAiName('custom:  Klingon  ')).toBe('Klingon');
  });

  it('upgrades legacy bare codes/aiNames before resolving', () => {
    expect(langIdToAiName('Spanish')).toBe('Spanish');
    expect(langIdToAiName('ES')).toBe('Spanish');
    expect(langIdToAiName('fr')).toBe('Français');
  });

  it('returns the input verbatim for unknown free-form values', () => {
    expect(langIdToAiName('Bananaese')).toBe('Bananaese');
  });
});

describe('migrateAdaptationToLangId — wire-format normalization', () => {
  it('upgrades legacy aiName / bare-code values to canonical adapt: langIds', () => {
    expect(migrateAdaptationToLangId('Spanish')).toBe('adapt:ES');
    expect(migrateAdaptationToLangId('ES')).toBe('adapt:ES');
    expect(migrateAdaptationToLangId('adapt:ES')).toBe('adapt:ES');
    expect(migrateAdaptationToLangId('Romanian')).toBe('adapt:RO');
  });

  it('wraps unknown free text into a custom: sentinel', () => {
    expect(migrateAdaptationToLangId('Scots Gaelic')).toBe('custom:Scots Gaelic');
  });

  it('preserves existing custom: sentinels and empty strings', () => {
    expect(migrateAdaptationToLangId('custom:Klingon')).toBe('custom:Klingon');
    expect(migrateAdaptationToLangId('')).toBe('');
  });
});

describe('custom langId helpers', () => {
  it('isCustomLangId / readCustomLangText / buildCustomLangId round-trip', () => {
    const built = buildCustomLangId('Scots Gaelic');
    expect(built).toBe('custom:Scots Gaelic');
    expect(isCustomLangId(built!)).toBe(true);
    expect(readCustomLangText(built!)).toBe('Scots Gaelic');

    expect(buildCustomLangId('   ')).toBeUndefined();
    expect(isCustomLangId('adapt:ES')).toBe(false);
    expect(readCustomLangText('adapt:ES')).toBeUndefined();
  });

  it('getAdaptationLanguageByLangId returns the matching entry or undefined', () => {
    expect(getAdaptationLanguageByLangId('adapt:ES')?.aiName).toBe('Spanish');
    expect(getAdaptationLanguageByLangId('adapt:RO')?.sign).toBe('🇷🇴');
    expect(getAdaptationLanguageByLangId('adapt:UNKNOWN')).toBeUndefined();
    expect(getAdaptationLanguageByLangId('ui:fr')).toBeUndefined(); // not an adapt entry
  });
});

describe('getLanguageDisplay — custom: sentinel rendering', () => {
  it('renders a custom: sentinel as the typed text with a globe icon', () => {
    expect(getLanguageDisplay('custom:Scots Gaelic')).toMatchObject({
      label: 'Scots Gaelic',
      sign: '🌐',
    });
  });
});

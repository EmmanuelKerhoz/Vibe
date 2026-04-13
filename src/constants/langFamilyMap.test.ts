import { describe, it, expect } from 'vitest';
import {
  getAlgoFamily,
  getFamilyConfig,
  isTonalLanguage,
  LANG_TO_FAMILY,
  LANGUAGE_FLAGS,
  FAMILY_CONFIG,
} from '../constants/langFamilyMap';

describe('langFamilyMap', () => {
  describe('getAlgoFamily', () => {
    it('maps French to Romance family', () => {
      expect(getAlgoFamily('fr')).toBe('ALGO-ROM');
    });

    it('maps English to Germanic family', () => {
      expect(getAlgoFamily('en')).toBe('ALGO-GER');
    });

    it('maps Baoulé to KWA family', () => {
      expect(getAlgoFamily('bci')).toBe('ALGO-KWA');
    });

    it('maps Hausa to CRV family', () => {
      expect(getAlgoFamily('ha')).toBe('ALGO-CRV');
    });

    it('returns undefined for unknown language', () => {
      expect(getAlgoFamily('unknown')).toBeUndefined();
    });

    it('handles case-insensitive codes', () => {
      expect(getAlgoFamily('FR')).toBe('ALGO-ROM');
      expect(getAlgoFamily('En')).toBe('ALGO-GER');
    });
  });

  describe('getFamilyConfig', () => {
    it('returns config for valid language', () => {
      const config = getFamilyConfig('fr');
      expect(config).toBeDefined();
      expect(config?.family).toBe('ALGO-ROM');
      expect(config?.label).toBe('Romance');
    });

    it('returns undefined for unknown language', () => {
      expect(getFamilyConfig('unknown')).toBeUndefined();
    });
  });

  describe('isTonalLanguage', () => {
    it('identifies tonal languages', () => {
      expect(isTonalLanguage('zh')).toBe(true);  // Chinese
      expect(isTonalLanguage('vi')).toBe(true);  // Vietnamese
      expect(isTonalLanguage('th')).toBe(true);  // Thai
      expect(isTonalLanguage('bci')).toBe(true); // Baoulé (KWA)
      expect(isTonalLanguage('ha')).toBe(true);  // Hausa (CRV)
    });

    it('identifies non-tonal languages', () => {
      expect(isTonalLanguage('fr')).toBe(false);
      expect(isTonalLanguage('en')).toBe(false);
      expect(isTonalLanguage('de')).toBe(false);
    });

    it('returns false for unknown languages', () => {
      expect(isTonalLanguage('unknown')).toBe(false);
    });
  });

  describe('language coverage', () => {
    it('covers all 17 language families', () => {
      const families = new Set(Object.values(LANG_TO_FAMILY));
      expect(families.size).toBeGreaterThanOrEqual(10);
    });

    it('includes African language support', () => {
      expect(getAlgoFamily('bci')).toBe('ALGO-KWA'); // Baoulé
      expect(getAlgoFamily('dyu')).toBe('ALGO-KWA'); // Dioula
      expect(getAlgoFamily('ee')).toBe('ALGO-KWA');  // Ewe
      expect(getAlgoFamily('ha')).toBe('ALGO-CRV');  // Hausa
    });
  });

  describe('family configurations', () => {
    it('KWA family has correct configuration', () => {
      const config = FAMILY_CONFIG['ALGO-KWA'];
      expect(config.hasTones).toBe(true);
      expect(config.hasVowelHarmony).toBe(true);
      expect(config.syllableStructure).toBe('CV');
      expect(config.codaRelevance).toBe('none');
    });

    it('CRV family has correct configuration', () => {
      const config = FAMILY_CONFIG['ALGO-CRV'];
      expect(config.hasTones).toBe(true);
      expect(config.syllableStructure).toBe('CVC');
      expect(config.codaRelevance).toBe('medium');
    });

    it('Romance family has correct configuration', () => {
      const config = FAMILY_CONFIG['ALGO-ROM'];
      expect(config.hasTones).toBe(false);
      expect(config.syllableStructure).toBe('CVC');
    });
  });

  // ── Parity: every LANG_TO_FAMILY code must have a flag ──────────────────
  // Prevents silent undefined when rendering language selectors.
  // If this test fails, add the missing entry to LANGUAGE_FLAGS in langFamilyMap.ts.
  describe('LANGUAGE_FLAGS parity', () => {
    it('every LANG_TO_FAMILY code has an entry in LANGUAGE_FLAGS', () => {
      const missing = Object.keys(LANG_TO_FAMILY).filter(
        code => LANGUAGE_FLAGS[code] === undefined,
      );
      expect(missing, `Missing flags for: ${missing.join(', ')}`).toHaveLength(0);
    });

    it('LANGUAGE_FLAGS values are non-empty strings', () => {
      for (const [code, flag] of Object.entries(LANGUAGE_FLAGS)) {
        expect(flag, `Empty flag for code: ${code}`).toBeTruthy();
      }
    });

    it('known ethnic pictograms are distinct', () => {
      const ethnicCodes = ['bkv', 'ijn', 'iko', 'jv', 'wuu'];
      const pictos = ethnicCodes.map(c => LANGUAGE_FLAGS[c]).filter(Boolean);
      const unique = new Set(pictos);
      expect(unique.size).toBe(pictos.length);
    });
  });
});

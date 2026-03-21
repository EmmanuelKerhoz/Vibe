import { describe, it, expect } from 'vitest';
import { countSyllables, countSyllablesWithFamily } from './syllableUtils';

describe('syllableUtils', () => {
  describe('countSyllables (legacy compatibility)', () => {
    it('counts syllables for French text', () => {
      expect(countSyllables('bonjour')).toBeGreaterThan(0);
      expect(countSyllables('monde')).toBeGreaterThan(0);
    });

    it('returns 0 for empty text', () => {
      expect(countSyllables('')).toBe(0);
      expect(countSyllables('   ')).toBe(0);
    });
  });

  describe('countSyllablesWithFamily', () => {
    it('uses French method for FR without langCode', () => {
      const result = countSyllablesWithFamily('bonjour');
      expect(result.count).toBeGreaterThan(0);
      expect(result.method).toBe('graphemic');
    });

    it('dispatches to Romance family for French', () => {
      const result = countSyllablesWithFamily('monde', 'fr');
      expect(result.count).toBeGreaterThan(0);
      expect(result.family).toBe('ALGO-ROM');
      expect(result.method).toBe('graphemic');
    });

    it('dispatches to Romance family for Spanish', () => {
      const result = countSyllablesWithFamily('hola', 'es');
      expect(result.count).toBeGreaterThan(0);
      expect(result.family).toBe('ALGO-ROM');
    });

    it('dispatches to Germanic family for English', () => {
      const result = countSyllablesWithFamily('hello', 'en');
      expect(result.count).toBeGreaterThan(0);
      expect(result.family).toBe('ALGO-GER');
    });

    it('uses moraic method for Japanese', () => {
      const result = countSyllablesWithFamily('こんにちは', 'ja');
      expect(result.method).toBe('moraic');
      expect(result.family).toBe('ALGO-JAP');
    });

    it('uses tonal-CV method for KWA languages', () => {
      const result = countSyllablesWithFamily('test', 'bci'); // Baoulé
      expect(result.method).toBe('tonal-CV');
      expect(result.family).toBe('ALGO-KWA');
    });

    it('uses tonal-CV method for CRV languages', () => {
      const result = countSyllablesWithFamily('test', 'ha'); // Hausa
      expect(result.method).toBe('tonal-CV');
      expect(result.family).toBe('ALGO-CRV');
    });

    it('uses fallback for unknown languages', () => {
      const result = countSyllablesWithFamily('text', 'unknown');
      expect(result.count).toBeGreaterThan(0);
      expect(result.method).toBe('graphemic');
      expect(result.family).toBeUndefined();
    });

    it('handles empty text', () => {
      const result = countSyllablesWithFamily('', 'fr');
      expect(result.count).toBe(0);
    });

    it('handles whitespace-only text', () => {
      const result = countSyllablesWithFamily('   ', 'en');
      expect(result.count).toBe(0);
    });
  });

  describe('language family dispatch', () => {
    it('provides metadata about method used', () => {
      const frResult = countSyllablesWithFamily('bonjour', 'fr');
      expect(frResult.method).toBeDefined();
      expect(frResult.family).toBeDefined();

      const enResult = countSyllablesWithFamily('hello', 'en');
      expect(enResult.method).toBeDefined();
      expect(enResult.family).toBeDefined();
    });

    it('differentiates between CV and CVC languages', () => {
      const kwaResult = countSyllablesWithFamily('test', 'bci'); // KWA: CV
      const romResult = countSyllablesWithFamily('test', 'fr');  // ROM: CVC

      expect(kwaResult.method).toBe('tonal-CV');
      expect(romResult.method).toBe('graphemic');
    });
  });

  describe('backward compatibility', () => {
    it('countSyllables without langCode behaves like old implementation', () => {
      const text = 'bonjour le monde';
      const oldStyleResult = countSyllables(text);
      const newStyleResult = countSyllablesWithFamily(text);

      expect(oldStyleResult).toBe(newStyleResult.count);
    });
  });
});

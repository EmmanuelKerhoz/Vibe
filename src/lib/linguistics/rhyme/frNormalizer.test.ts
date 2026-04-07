/**
 * frNormalizer.test.ts
 * Unit tests for the French pre-normalisation pass.
 * Run with: npx vitest run src/lib/linguistics/rhyme/frNormalizer.test.ts
 */

import { describe, it, expect } from 'vitest';
import { normalizeFrenchForRhyme } from './frNormalizer';

describe('normalizeFrenchForRhyme', () => {

  describe('verbal -ent stripping', () => {
    it('chantent → chant', () => expect(normalizeFrenchForRhyme('chantent')).toBe('chant'));
    it('parlent  → parl',  () => expect(normalizeFrenchForRhyme('parlent')).toBe('parl'));
    it('mangent  → mang',  () => expect(normalizeFrenchForRhyme('mangent')).toBe('mang'));
  });

  describe('nominal -ent preserved', () => {
    it('vent    → vent',   () => expect(normalizeFrenchForRhyme('vent')).toBe('vent'));
    it('argent  → argent', () => expect(normalizeFrenchForRhyme('argent')).toBe('argent'));
    it('accent  → accent', () => expect(normalizeFrenchForRhyme('accent')).toBe('accent'));
    it('patient → patient',() => expect(normalizeFrenchForRhyme('patient')).toBe('patient'));
  });

  describe('silent -es stripping', () => {
    it('roses  → ros',  () => expect(normalizeFrenchForRhyme('roses')).toBe('ros'));
    it('grandes → grand', () => expect(normalizeFrenchForRhyme('grandes')).toBe('grand'));
  });

  describe('silent -e final stripping', () => {
    it('chante → chant', () => expect(normalizeFrenchForRhyme('chante')).toBe('chant'));
    it('monde  → mond',  () => expect(normalizeFrenchForRhyme('monde')).toBe('mond'));
    it('rose   → ros',   () => expect(normalizeFrenchForRhyme('rose')).toBe('ros'));
  });

  describe('sonorant cluster preserved', () => {
    it('libre  → libre', () => expect(normalizeFrenchForRhyme('libre')).toBe('libre'));
    it('sombre → sombre',() => expect(normalizeFrenchForRhyme('sombre')).toBe('sombre'));
    it('ventre → ventre',() => expect(normalizeFrenchForRhyme('ventre')).toBe('ventre'));
    it('simple → simple',() => expect(normalizeFrenchForRhyme('simple')).toBe('simple'));
  });

  describe('clitic pass-through', () => {
    it('le → le', () => expect(normalizeFrenchForRhyme('le')).toBe('le'));
    it('me → me', () => expect(normalizeFrenchForRhyme('me')).toBe('me'));
    it('que → que', () => expect(normalizeFrenchForRhyme('que')).toBe('que'));
  });

  describe('edge cases', () => {
    it('empty string → empty', () => expect(normalizeFrenchForRhyme('')).toBe(''));
    it('single char → unchanged', () => expect(normalizeFrenchForRhyme('a')).toBe('a'));
    it('two chars → unchanged', () => expect(normalizeFrenchForRhyme('de')).toBe('de'));
  });
});

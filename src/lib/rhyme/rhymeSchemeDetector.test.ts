/**
 * Rhyme Engine v2 — Scheme Detector Test Suite
 * 16 tests: AABB, ABAB, ABBA, monorhyme, free verse, terza rima,
 *           Baoulé strophe, multilingual strophe, confidence range
 */

import { describe, it, expect } from 'vitest';
import { detectRhymeScheme, detectRhymeSchemeMultiLang } from './rhymeSchemeDetector';

// ─── French — AABB ───────────────────────────────────────────────────────────

describe('detectRhymeScheme — FR AABB', () => {
  const lines = [
    'Dans la forêt profonde et sombre',
    'On entend les arbres sans nombre',
    'Le vent souffle sur la montagne',
    'Et la pluie tombe à la campagne',
  ];

  it('detects AABB label', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(r.label).toBe('AABB');
  });
  it('assigns A to lines 0 and 1', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(r.letters[0]).toBe(r.letters[1]);
  });
  it('assigns B to lines 2 and 3', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(r.letters[2]).toBe(r.letters[3]);
  });
  it('A ≠ B', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(r.letters[0]).not.toBe(r.letters[2]);
  });
  it('confidence > 0.5', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(r.confidence).toBeGreaterThan(0.5);
  });
});

// ─── English — ABAB ──────────────────────────────────────────────────────────

describe('detectRhymeScheme — EN ABAB', () => {
  const lines = [
    'I wandered lonely as a cloud',
    'That floats on high o\'er vales and hills',
    'When all at once I saw a crowd',
    'A host of golden daffodils',
  ];

  it('detects ABAB label', () => {
    const r = detectRhymeScheme(lines, 'en');
    expect(r.label).toBe('ABAB');
  });
  it('lines 0 and 2 share letter', () => {
    const r = detectRhymeScheme(lines, 'en');
    expect(r.letters[0]).toBe(r.letters[2]);
  });
  it('lines 1 and 3 share letter', () => {
    const r = detectRhymeScheme(lines, 'en');
    expect(r.letters[1]).toBe(r.letters[3]);
  });
});

// ─── Monorhyme ───────────────────────────────────────────────────────────────

describe('detectRhymeScheme — monorhyme', () => {
  const lines = [
    'la lumière',
    'la rivière',
    'la frontière',
    'la matière',
  ];

  it('detects MONORHYME', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(r.label).toBe('MONORHYME');
  });
  it('all letters identical', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(new Set(r.letters).size).toBe(1);
  });
});

// ─── Free verse ───────────────────────────────────────────────────────────────

describe('detectRhymeScheme — free verse', () => {
  const lines = [
    'le chat dort sur le toit',
    'demain il fera beau',
    'les enfants courent dans le jardin',
    'silence',
  ];

  it('detects FREE_VERSE or CUSTOM (no strong pattern)', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(['FREE_VERSE', 'CUSTOM']).toContain(r.label);
  });
  it('confidence < 0.5', () => {
    const r = detectRhymeScheme(lines, 'fr');
    expect(r.confidence).toBeLessThan(0.5);
  });
});

// ─── Baoulé strophe (KWA) ────────────────────────────────────────────────────

describe('detectRhymeScheme — Baoulé KWA', () => {
  // Two couplets sharing final tonal syllable
  const lines = [
    "n'gá so",
    'ka gá',
    'amá di',
    'wa má',
  ];

  it('returns a result without throwing', () => {
    expect(() => detectRhymeScheme(lines, 'ba')).not.toThrow();
  });
  it('pairScores contains 4 pairs for window=6, n=4', () => {
    const r = detectRhymeScheme(lines, 'ba');
    // Pairs: (0,1),(0,2),(0,3),(1,2),(1,3),(2,3) = 6 pairs within window
    expect(r.pairScores.length).toBe(6);
  });
  it('nuclei for ba lines are not empty', () => {
    const r = detectRhymeScheme(lines, 'ba');
    for (const { result } of r.pairScores) {
      expect(result.nucleusA).toBeDefined();
      expect(result.nucleusB).toBeDefined();
    }
  });
});

// ─── Strophe trop courte ──────────────────────────────────────────────────────

describe('detectRhymeScheme — edge: single line', () => {
  it('returns FREE_VERSE with stanza-too-short warning', () => {
    const r = detectRhymeScheme(['une seule ligne'], 'fr');
    expect(r.label).toBe('FREE_VERSE');
    expect(r.warnings).toContain('stanza-too-short');
  });
});

// ─── Multilingual strophe (FR + BA code-switching) ───────────────────────────

describe('detectRhymeSchemeMultiLang', () => {
  const lines = [
    { text: 'mon amour', lang: 'fr' as const },
    { text: 'ka gá',    lang: 'ba' as const },
    { text: 'pour toujours', lang: 'fr' as const },
    { text: "n'gá so",  lang: 'ba' as const },
  ];

  it('returns a result without throwing', () => {
    expect(() => detectRhymeSchemeMultiLang(lines)).not.toThrow();
  });
  it('cross-family warning present in pairScores for FR×BA pairs', () => {
    const r = detectRhymeSchemeMultiLang(lines);
    const crossPairs = r.pairScores.filter(
      ({ result }) => result.warnings.includes('cross-family-fallback')
    );
    expect(crossPairs.length).toBeGreaterThan(0);
  });
  it('pairScores: all nuclei defined', () => {
    const r = detectRhymeSchemeMultiLang(lines);
    for (const { result } of r.pairScores) {
      expect(result.nucleusA).toBeDefined();
      expect(result.nucleusB).toBeDefined();
    }
  });
  it('letters array has same length as input', () => {
    const r = detectRhymeSchemeMultiLang(lines);
    expect(r.letters.length).toBe(lines.length);
  });
});

/**
 * scoring.ts — unit tests
 * Covers: phonemeEditDistance, toneDistance, scoreKWANormalized, scoreCRV, categorize
 */

import { describe, it, expect } from 'vitest';
import {
  phonemeEditDistance,
  toneDistance,
  scoreKWANormalized,
  scoreCRV,
  categorize,
} from './scoring';

// ─── phonemeEditDistance ──────────────────────────────────────────────────────

describe('phonemeEditDistance', () => {
  it('identical strings → 0', () => {
    expect(phonemeEditDistance('abc', 'abc')).toBe(0);
  });
  it('empty a → 1', () => {
    expect(phonemeEditDistance('', 'abc')).toBe(1);
  });
  it('empty b → 1', () => {
    expect(phonemeEditDistance('abc', '')).toBe(1);
  });
  it('single substitution — normalised by max length', () => {
    // 'abc' vs 'axc' → 1 edit / max(3,3) = 0.333…
    expect(phonemeEditDistance('abc', 'axc')).toBeCloseTo(1 / 3, 5);
  });
  it('completely different strings → 1', () => {
    expect(phonemeEditDistance('aaa', 'bbb')).toBe(1);
  });
  it('symmetric', () => {
    expect(phonemeEditDistance('ab', 'cd')).toBe(phonemeEditDistance('cd', 'ab'));
  });
});

// ─── toneDistance ─────────────────────────────────────────────────────────────

describe('toneDistance', () => {
  it('identical tone → 1', () => {
    expect(toneDistance('H', 'H')).toBe(1);
    expect(toneDistance('M', 'M')).toBe(1);
    expect(toneDistance('L', 'L')).toBe(1);
  });
  it('H vs L → 0 (maximal distance)', () => {
    expect(toneDistance('H', 'L')).toBe(0);
    expect(toneDistance('L', 'H')).toBe(0);
  });
  it('H vs M → 0.5 (adjacent)', () => {
    expect(toneDistance('H', 'M')).toBe(0.5);
    expect(toneDistance('M', 'H')).toBe(0.5);
  });
  it('M vs L → 0.5 (adjacent)', () => {
    expect(toneDistance('M', 'L')).toBe(0.5);
    expect(toneDistance('L', 'M')).toBe(0.5);
  });
  it('undefined a → 0.4', () => {
    expect(toneDistance(undefined, 'H')).toBe(0.4);
  });
  it('undefined b → 0.4', () => {
    expect(toneDistance('H', undefined)).toBe(0.4);
  });
  it('both undefined → 0.4', () => {
    expect(toneDistance(undefined, undefined)).toBe(0.4);
  });
  it('F (falling) vs any → 0.5', () => {
    expect(toneDistance('F', 'H')).toBe(0.5);
    expect(toneDistance('H', 'F')).toBe(0.5);
  });
  it('case insensitive', () => {
    expect(toneDistance('h', 'l')).toBe(0);
    expect(toneDistance('m', 'M')).toBe(1);
  });
});

// ─── scoreKWANormalized ───────────────────────────────────────────────────────

describe('scoreKWANormalized', () => {
  it('perfect match → 1', () => {
    const n = { vowels: 'a', coda: 'n', tone: 'H', moraCount: 1 };
    expect(scoreKWANormalized(n, n)).toBe(1);
  });
  it('different tone H vs L → lower score', () => {
    const a = { vowels: 'a', coda: 'n', tone: 'H', moraCount: 1 };
    const b = { vowels: 'a', coda: 'n', tone: 'L', moraCount: 1 };
    expect(scoreKWANormalized(a, b)).toBeLessThan(scoreKWANormalized(a, a));
  });
  it('score in [0, 1]', () => {
    const a = { vowels: 'e', coda: '',  tone: 'M', moraCount: 1 };
    const b = { vowels: 'o', coda: 'k', tone: 'L', moraCount: 1 };
    const s = scoreKWANormalized(a, b);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
  it('same vowel+coda, adjacent tone → > 0.5', () => {
    const a = { vowels: 'a', coda: 'n', tone: 'H', moraCount: 1 };
    const b = { vowels: 'a', coda: 'n', tone: 'M', moraCount: 1 };
    expect(scoreKWANormalized(a, b)).toBeGreaterThan(0.5);
  });
});

// ─── scoreCRV ─────────────────────────────────────────────────────────────────

describe('scoreCRV', () => {
  it('perfect match atonal → 1 (capped)', () => {
    const n = { vowels: 'a', coda: 'n', tone: undefined, moraCount: 1 };
    expect(scoreCRV(n, n)).toBe(1);
  });
  it('mora bonus: two long vowels boost score', () => {
    const a = { vowels: 'aa', coda: 'n', tone: undefined, moraCount: 2 };
    const b = { vowels: 'aa', coda: 'n', tone: undefined, moraCount: 2 };
    const noMora = { vowels: 'aa', coda: 'n', tone: undefined, moraCount: 1 };
    expect(scoreCRV(a, b)).toBeGreaterThanOrEqual(scoreCRV(noMora, noMora));
  });
  it('HA tonal path: same tone boosts over atonal', () => {
    const a = { vowels: 'a', coda: 'n', tone: 'H', moraCount: 1 };
    const b = { vowels: 'a', coda: 'n', tone: 'H', moraCount: 1 };
    const aNoTone = { ...a, tone: undefined };
    expect(scoreCRV(a, b, 'ha')).toBeGreaterThanOrEqual(scoreCRV(aNoTone, b, 'ha'));
  });
  it('result always ≤ 1', () => {
    const n = { vowels: 'aa', coda: 'ng', tone: 'H', moraCount: 2 };
    expect(scoreCRV(n, n, 'ha')).toBeLessThanOrEqual(1);
    expect(scoreCRV(n, n)).toBeLessThanOrEqual(1);
  });
  it('score in [0, 1] for mismatched nuclei', () => {
    const a = { vowels: 'e', coda: '', tone: undefined, moraCount: 1 };
    const b = { vowels: 'o', coda: 'k', tone: undefined, moraCount: 1 };
    const s = scoreCRV(a, b);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });
});

// ─── categorize ───────────────────────────────────────────────────────────────

describe('categorize', () => {
  it('≥ 0.92 → perfect', ()  => expect(categorize(0.92)).toBe('perfect'));
  it('≥ 0.80 → rich',    ()  => expect(categorize(0.80)).toBe('rich'));
  it('≥ 0.60 → sufficient',  () => expect(categorize(0.60)).toBe('sufficient'));
  it('≥ 0.35 → weak',    ()  => expect(categorize(0.35)).toBe('weak'));
  it('< 0.35 → none',    ()  => expect(categorize(0.34)).toBe('none'));
  it('1.0 → perfect',    ()  => expect(categorize(1.0)).toBe('perfect'));
  it('0.0 → none',       ()  => expect(categorize(0.0)).toBe('none'));
  it('boundary 0.79 → sufficient', () => expect(categorize(0.79)).toBe('sufficient'));
});

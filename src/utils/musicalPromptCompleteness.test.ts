import { describe, it, expect } from 'vitest';
import {
  COMPLETENESS_TOTAL,
  computeCompleteness,
} from './musicalPromptCompleteness';

describe('computeCompleteness', () => {
  it('returns 0% for undefined / null / empty / whitespace-only inputs', () => {
    for (const input of [undefined, null, '', '   ', '\n\t\n']) {
      expect(computeCompleteness(input)).toEqual({
        filled: 0,
        total: COMPLETENESS_TOTAL,
        pct: 0,
      });
    }
  });

  it('counts a single section match', () => {
    expect(computeCompleteness('STYLE: cinematic pop')).toEqual({
      filled: 1,
      total: COMPLETENESS_TOTAL,
      pct: 20,
    });
  });

  it('does not double-count multiple matches inside the same section bucket', () => {
    // both `mood` and `vibe` are in the same regex bucket → still counts once
    const result = computeCompleteness('warm mood, intimate vibe');
    expect(result.filled).toBe(1);
    expect(result.pct).toBe(20);
  });

  it('detects every canonical section in a fully populated prompt', () => {
    const prompt = [
      'STYLE: cinematic pop',
      'MOOD: warm, hopeful',
      'VOCALS: smooth tenor with airy harmonies',
      'INSTRUMENTATION: warm piano, ambient pads — TEMPO 95 BPM',
      'STRUCTURE: verse / chorus / bridge / chorus',
    ].join('\n');
    expect(computeCompleteness(prompt)).toEqual({
      filled: COMPLETENESS_TOTAL,
      total: COMPLETENESS_TOTAL,
      pct: 100,
    });
  });

  it('matches alternative keywords inside a bucket (voice, bpm, verse)', () => {
    expect(computeCompleteness('male voice over a 120 bpm groove with verse hooks').filled).toBe(3);
  });

  it('is case-insensitive', () => {
    const lower = computeCompleteness('style mood vocal instrument structure');
    const upper = computeCompleteness('STYLE MOOD VOCAL INSTRUMENT STRUCTURE');
    expect(lower).toEqual(upper);
    expect(lower.pct).toBe(100);
  });

  it('rounds the percentage', () => {
    // 2/5 = 40 — exact, no rounding ambiguity
    expect(computeCompleteness('style mood').pct).toBe(40);
    // 3/5 = 60
    expect(computeCompleteness('style mood vocals').pct).toBe(60);
  });
});

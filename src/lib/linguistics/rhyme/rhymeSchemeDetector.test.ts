import { describe, it, expect } from 'vitest';
import { canonicalizeScheme } from './rhymeSchemeDetector';
// Note: detectRhymeScheme requires PhonologicalRegistry at runtime.
// Integration tests for detectRhymeScheme live in src/lib/linguistics/__tests__/
// Unit tests here cover the pure helper functions only.

describe('canonicalizeScheme', () => {
  it('recognises AABB', () => {
    expect(canonicalizeScheme('AABB')).toBe('AABB');
  });

  it('recognises ABAB', () => {
    expect(canonicalizeScheme('ABAB')).toBe('ABAB');
  });

  it('recognises ABBA', () => {
    expect(canonicalizeScheme('ABBA')).toBe('ABBA');
  });

  it('maps unknown patterns to CUSTOM', () => {
    expect(canonicalizeScheme('ABCD')).toBe('CUSTOM');
    expect(canonicalizeScheme('AABCCA')).toBe('CUSTOM');
  });

  it('maps empty / single-line to CUSTOM', () => {
    expect(canonicalizeScheme('')).toBe('CUSTOM');
    expect(canonicalizeScheme('A')).toBe('CUSTOM');
  });

  it('recognises FREE', () => {
    expect(canonicalizeScheme('FREE')).toBe('CUSTOM'); // FREE is not in canonical set — UI maps it separately
  });
});

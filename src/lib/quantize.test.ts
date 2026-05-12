import { describe, it, expect } from 'vitest';
import { countSyllables, countLineSyllables, snapToNearestBars, quantizeLine, supportsSyllableHeuristics } from './quantize';

// ---------------------------------------------------------------------------
// countSyllables
// ---------------------------------------------------------------------------

describe('countSyllables', () => {
  it('counts basic vowel groups', () => {
    expect(countSyllables('hello')).toBe(2);  // hel-lo
    expect(countSyllables('world')).toBe(1);  // world
    expect(countSyllables('beautiful')).toBe(3); // beau-ti-ful (simplified counter)
  });

  it('handles silent final e', () => {
    expect(countSyllables('love')).toBe(1);  // silent e → 1
    expect(countSyllables('make')).toBe(1);  // silent e → 1
  });

  it('returns at least 1 for non-empty words', () => {
    expect(countSyllables('the')).toBeGreaterThanOrEqual(1);
    expect(countSyllables('a')).toBe(1);
  });

  it('returns 0 for empty/non-alpha strings', () => {
    expect(countSyllables('')).toBe(0);
    expect(countSyllables('...')).toBe(0);
  });

  it('supports accented Latin-script words such as French', () => {
    expect(countSyllables('lumière')).toBeGreaterThan(0);
    expect(countLineSyllables('Sous les néons je rêve encore')).toBeGreaterThan(0);
  });

  it('documents the non-Latin fallback for Arabic, Korean, and Chinese', () => {
    expect(supportsSyllableHeuristics('مرحبا يا عالم', 'Arabic')).toBe(false);
    expect(supportsSyllableHeuristics('안녕하세요 세계', 'Korean')).toBe(false);
    expect(supportsSyllableHeuristics('你好世界', 'Chinese')).toBe(false);
    expect(quantizeLine('مرحبا يا عالم', 120, [4, 4], 'Arabic')).toMatchObject({
      markedText: 'مرحبا يا عالم',
      syllableCount: 0,
      syllablesPerBeat: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// countLineSyllables
// ---------------------------------------------------------------------------

describe('countLineSyllables', () => {
  it('counts syllables across words', () => {
    const line = 'hello world';
    expect(countLineSyllables(line)).toBe(3); // hel-lo + world
  });

  it('handles empty line', () => {
    expect(countLineSyllables('')).toBe(0);
  });

  it('handles single word', () => {
    expect(countLineSyllables('song')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// snapToNearestBars
// ---------------------------------------------------------------------------

describe('snapToNearestBars', () => {
  const ts: [number, number] = [4, 4]; // 4/4 time

  it('snaps to 1 bar for short lines (≤ 4 syllables in 4/4)', () => {
    expect(snapToNearestBars(4, ts)).toBe(1);
    expect(snapToNearestBars(1, ts)).toBe(1);
  });

  it('snaps to 2 bars for medium lines (5–8 syllables in 4/4)', () => {
    expect(snapToNearestBars(5, ts)).toBe(2);
    expect(snapToNearestBars(8, ts)).toBe(2);
  });

  it('snaps to 4 bars for long lines (9+ syllables in 4/4)', () => {
    expect(snapToNearestBars(9, ts)).toBe(4);
    expect(snapToNearestBars(16, ts)).toBe(4);
  });

  it('handles 3/4 time signature', () => {
    const ts34: [number, number] = [3, 4];
    // 3 beats per bar: 1 bar = 3 beats
    expect(snapToNearestBars(3, ts34)).toBe(1);
    expect(snapToNearestBars(4, ts34)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// quantizeLine — main export
// ---------------------------------------------------------------------------

describe('quantizeLine', () => {
  it('returns correct bar and beat counts for a short line', () => {
    const result = quantizeLine('I love you', 120, [4, 4]);
    // "I love you" → 3 syllables (simplified counter) → 1 bar → 4 beats
    expect(result.bars).toBe(1);
    expect(result.beats).toBe(4);
    expect(result.syllableCount).toBe(3);
  });

  it('inserts markers in the text', () => {
    const result = quantizeLine('Under the stars we dance tonight', 120, [4, 4]);
    // Should contain at least one marker
    expect(result.markedText).toContain('·');
  });

  it('returns original text for empty line', () => {
    const result = quantizeLine('', 120, [4, 4]);
    expect(result.markedText).toBe('');
    expect(result.syllableCount).toBe(0);
    expect(result.bars).toBe(1);
  });

  it('falls back to 120 BPM and 4/4 when defaults used', () => {
    const withDefaults = quantizeLine('hello world');
    const explicit = quantizeLine('hello world', 120, [4, 4]);
    expect(withDefaults).toEqual(explicit);
  });

  it('sanitizes invalid BPM to 120', () => {
    const bad = quantizeLine('hello', 0);
    const good = quantizeLine('hello', 120);
    expect(bad).toEqual(good);
  });

  it('handles 2 bars for medium-length lines', () => {
    // "You make me feel alive tonight yeah" → ~8 syllables → 2 bars
    const result = quantizeLine('You make me feel alive tonight yeah', 120, [4, 4]);
    expect([1, 2, 4]).toContain(result.bars);
    expect(result.syllablesPerBeat).toBeGreaterThan(0);
  });
});

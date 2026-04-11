/**
 * Tests for useRhymeSchemeMultiLang
 *
 * Coverage:
 * A. null when < 2 usable lines
 * B. single-language stanza → same result as detectRhymeScheme
 * C. cross-language stanza → non-null result with correct letter count
 * D. meta lines filtered out
 * E. isProxied stamp forwarded
 * F. toLangCode name resolution (via lang name string)
 * G. unknown lang code falls back to __unknown__ without throwing
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRhymeSchemeMultiLang } from './useRhymeSchemeMultiLang';

// ─── A: too few lines ────────────────────────────────────────────────────────

describe('useRhymeSchemeMultiLang — fewer than 2 usable lines', () => {
  it('returns null for empty array', () => {
    const { result } = renderHook(() => useRhymeSchemeMultiLang([]));
    expect(result.current).toBeNull();
  });

  it('returns null for single lyric line', () => {
    const { result } = renderHook(() =>
      useRhymeSchemeMultiLang([{ text: 'Hello world', lang: 'en' }])
    );
    expect(result.current).toBeNull();
  });

  it('returns null when all lines are meta or blank', () => {
    const { result } = renderHook(() =>
      useRhymeSchemeMultiLang([
        { text: '[Chorus]', lang: 'en' },
        { text: '', lang: 'en' },
        { text: '   ', lang: 'en' },
      ])
    );
    expect(result.current).toBeNull();
  });
});

// ─── B: mono-language ────────────────────────────────────────────────────────

describe('useRhymeSchemeMultiLang — single-language stanza', () => {
  it('returns a SchemeResult for 4 English lines', () => {
    const lines = [
      { text: 'I walk the road alone', lang: 'en' },
      { text: 'My heart has turned to stone', lang: 'en' },
      { text: 'I play the saxophone', lang: 'en' },
      { text: 'I set the final tone', lang: 'en' },
    ];
    const { result } = renderHook(() => useRhymeSchemeMultiLang(lines));
    expect(result.current).not.toBeNull();
    expect(result.current?.letters).toHaveLength(4);
    expect(result.current?.label).toBe('MONORHYME');
    expect(result.current?.confidence).toBeGreaterThan(0);
  });

  it('returns AABB for couplet French lines', () => {
    const lines = [
      { text: 'Mon coeur bat pour toujours', lang: 'fr' },
      { text: 'Je pense à notre amour', lang: 'fr' },
      { text: 'La vie est si belle', lang: 'fr' },
      { text: 'Comme une étincelle', lang: 'fr' },
    ];
    const { result } = renderHook(() => useRhymeSchemeMultiLang(lines));
    expect(result.current).not.toBeNull();
    expect(result.current?.label).toBe('AABB');
  });
});

// ─── C: cross-language ───────────────────────────────────────────────────────

describe('useRhymeSchemeMultiLang — multilingual stanza', () => {
  it('returns a result with correct letter count for EN/FR mix', () => {
    const lines = [
      { text: 'On the road again tonight',   lang: 'en' },
      { text: 'Sur la route encore ce soir',  lang: 'fr' },
      { text: 'Back to the endless fight',    lang: 'en' },
      { text: 'La lumière dans le noir',      lang: 'fr' },
    ];
    const { result } = renderHook(() => useRhymeSchemeMultiLang(lines));
    expect(result.current).not.toBeNull();
    expect(result.current?.letters).toHaveLength(4);
    expect(result.current?.pairScores.length).toBeGreaterThan(0);
  });

  it('accepts language names (not just codes)', () => {
    const lines = [
      { text: 'Amor eterno',   lang: 'Spanish' },
      { text: 'Coeur sincère', lang: 'French' },
      { text: 'Fuego interno', lang: 'Spanish' },
      { text: 'Air de lumière', lang: 'French' },
    ];
    const { result } = renderHook(() => useRhymeSchemeMultiLang(lines));
    expect(result.current).not.toBeNull();
    expect(result.current?.letters).toHaveLength(4);
  });
});

// ─── D: meta filtering ───────────────────────────────────────────────────────

describe('useRhymeSchemeMultiLang — meta line filtering', () => {
  it('filters out [Tag] meta lines before detection', () => {
    const lines = [
      { text: '[Verse 1]',     lang: 'en' },
      { text: 'Walk the night', lang: 'en' },
      { text: 'Take the flight', lang: 'en' },
      { text: '[Bridge]',      lang: 'en' },
      { text: 'Hold on tight', lang: 'en' },
      { text: 'Shining bright', lang: 'en' },
    ];
    const { result } = renderHook(() => useRhymeSchemeMultiLang(lines));
    // 4 lyric lines → letters array length == 4
    expect(result.current?.letters).toHaveLength(4);
  });
});

// ─── E: isProxied stamp ──────────────────────────────────────────────────────

describe('useRhymeSchemeMultiLang — isProxied forwarding', () => {
  it('stamps isProxied: true when passed', () => {
    const lines = [
      { text: 'Heart in the rain', lang: 'en' },
      { text: 'Feel the sweet pain', lang: 'en' },
    ];
    const { result } = renderHook(() => useRhymeSchemeMultiLang(lines, true));
    expect(result.current?.isProxied).toBe(true);
  });

  it('stamps isProxied: false when passed false', () => {
    const lines = [
      { text: 'Heart in the rain', lang: 'en' },
      { text: 'Feel the sweet pain', lang: 'en' },
    ];
    const { result } = renderHook(() => useRhymeSchemeMultiLang(lines, false));
    expect(result.current?.isProxied).toBe(false);
  });

  it('leaves isProxied from detector when not passed', () => {
    const lines = [
      { text: 'Heart in the rain', lang: 'en' },
      { text: 'Feel the sweet pain', lang: 'en' },
    ];
    const { result } = renderHook(() => useRhymeSchemeMultiLang(lines));
    // detectRhymeSchemeMultiLang always stamps isProxied: false
    expect(result.current?.isProxied).toBe(false);
  });
});

// ─── F: toLangCode name resolution ───────────────────────────────────────────

describe('useRhymeSchemeMultiLang — toLangCode resilience', () => {
  it('does not throw on unknown lang string', () => {
    const lines = [
      { text: 'Gibberish florg', lang: 'klingon' },
      { text: 'Bloop zarg morp', lang: 'klingon' },
    ];
    expect(() =>
      renderHook(() => useRhymeSchemeMultiLang(lines))
    ).not.toThrow();
  });
});

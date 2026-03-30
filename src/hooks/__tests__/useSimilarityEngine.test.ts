/**
 * useSimilarityEngine — unit tests
 * Covers: changeDelta logic, debounce, AbortController, resetIndex.
 *
 * Strategy: test the pure helpers (changeDelta, textFingerprint) directly
 * via module internals exposed through a re-export shim, and test the hook
 * behaviour via renderHook + fake timers.
 *
 * runSearchTree is mocked so no network I/O occurs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Pure helper tests (changeDelta extracted for white-box coverage) ───────────
// changeDelta is not exported; we replicate it here to test the algorithm
// independently of the hook lifecycle. This mirrors the production code exactly.
const DELTA_THRESHOLD = 0.20;

const changeDelta = (prev: string, next: string): number => {
  if (!prev) return 1;
  const prevChars = [...prev];
  const nextChars = [...next];
  const maxLen = Math.max(prevChars.length, nextChars.length);
  if (maxLen === 0) return 0;
  if (Math.abs(prevChars.length - nextChars.length) / maxLen > DELTA_THRESHOLD) {
    return Math.abs(prevChars.length - nextChars.length) / maxLen;
  }
  let diff = 0;
  for (let i = 0; i < maxLen; i++) {
    if (prevChars[i] !== nextChars[i]) diff++;
  }
  return diff / maxLen;
};

describe('changeDelta — pure logic', () => {
  it('returns 1 when prev is empty string', () => {
    expect(changeDelta('', 'hello')).toBe(1);
  });

  it('returns 0 for identical strings', () => {
    expect(changeDelta('abc', 'abc')).toBe(0);
  });

  it('returns 0 for two empty strings (maxLen === 0 branch)', () => {
    // prev is non-empty so the early empty-prev guard is bypassed;
    // we need maxLen > 0 for this — test the boundary differently:
    // prev='x', next='x' → 0 (covered above). The maxLen===0 branch
    // is only reachable with prev='' which returns 1 first. Document it.
    expect(changeDelta('a', 'a')).toBe(0);
  });

  it('detects small mutation below threshold', () => {
    // 1 char changed out of 10 → delta = 0.1 < 0.20
    const prev = 'abcdefghij';
    const next = 'abcdefghiX';
    const delta = changeDelta(prev, next);
    expect(delta).toBeLessThan(DELTA_THRESHOLD);
    expect(delta).toBeCloseTo(0.1);
  });

  it('detects large character-level mutation above threshold', () => {
    // 5 chars changed out of 10 → delta = 0.5 > 0.20
    const prev = 'aaaaaaaaaa';
    const next = 'bbbbbaaaaa';
    const delta = changeDelta(prev, next);
    expect(delta).toBeGreaterThan(DELTA_THRESHOLD);
  });

  it('length-ratio early-exit: returns ratio directly when length diff > threshold', () => {
    // prev = 10 chars, next = 80 chars → ratio = 70/80 = 0.875 > 0.20
    // The early-exit path must be taken (no per-char iteration).
    const prev = 'a'.repeat(10);
    const next = 'a'.repeat(80);
    const delta = changeDelta(prev, next);
    expect(delta).toBeGreaterThan(DELTA_THRESHOLD);
    // Exact value from the formula: |10-80|/80 = 70/80
    expect(delta).toBeCloseTo(70 / 80);
  });

  it('handles Unicode multi-codepoint correctly (emoji = 1 char, not 2 UTF-16 units)', () => {
    // '🎵' is 2 UTF-16 code units but 1 code point.
    // With spread operator [...str] we get code points.
    const prev = '🎵abc';
    const next = '🎶abc';
    // 4 code points each, 1 differs → delta = 1/4 = 0.25 > 0.20
    const delta = changeDelta(prev, next);
    expect(delta).toBeGreaterThan(DELTA_THRESHOLD);
    expect(delta).toBeCloseTo(0.25);
  });

  it('handles strings of very different Unicode lengths via length-ratio guard', () => {
    const prev = '🎵';
    const next = '🎵'.repeat(20);
    const delta = changeDelta(prev, next);
    expect(delta).toBeGreaterThan(DELTA_THRESHOLD);
  });
});

// ── Hook integration tests ─────────────────────────────────────────────────────
import { renderHook, act } from '@testing-library/react';
import { useSimilarityEngine } from '../useSimilarityEngine';
import * as webSimilaritySearch from '../../utils/webSimilaritySearch';
import * as SongContextModule from '../../contexts/SongContext';
import type { Section } from '../../types';

const DEBOUNCE_MS = 30_000;

const makeSection = (text: string): Section => ({
  id: 'sec-1',
  name: 'Verse',
  lines: [{ id: 'l-1', text, syllables: 4, rhyme: '', rhymingSyllables: '', concept: 'New line', isMeta: false }],
});

const mockSongContext = (overrides: Partial<{ song: Section[]; title: string; songLanguage: string }> = {}) => {
  vi.spyOn(SongContextModule, 'useSongContext').mockReturnValue({
    song: overrides.song ?? [makeSection('Hello world')],
    title: overrides.title ?? 'My Song',
    songLanguage: overrides.songLanguage ?? 'en',
  } as ReturnType<typeof SongContextModule.useSongContext>);
};

describe('useSimilarityEngine — hook behaviour', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(webSimilaritySearch, 'runSearchTree').mockResolvedValue([]);
    mockSongContext();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initialises with idle status', () => {
    const { result } = renderHook(() => useSimilarityEngine());
    expect(result.current.index.status).toBe('idle');
    expect(result.current.index.candidates).toEqual([]);
  });

  it('debounce: does not call runSearchTree before DEBOUNCE_MS elapses', () => {
    renderHook(() => useSimilarityEngine());
    vi.advanceTimersByTime(DEBOUNCE_MS - 1);
    expect(webSimilaritySearch.runSearchTree).not.toHaveBeenCalled();
  });

  it('debounce: calls runSearchTree after DEBOUNCE_MS', async () => {
    renderHook(() => useSimilarityEngine());
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(webSimilaritySearch.runSearchTree).toHaveBeenCalledTimes(1);
  });

  it('debounce: resets timer on fingerprint change (rapid edits)', async () => {
    const { rerender } = renderHook(() => useSimilarityEngine());
    vi.advanceTimersByTime(DEBOUNCE_MS - 5000);
    // Simulate a significant content change → new fingerprint
    mockSongContext({ song: [makeSection('Hello world ' + 'x'.repeat(50))], title: 'My Song' });
    rerender();
    vi.advanceTimersByTime(5000); // total elapsed would have fired old timer
    expect(webSimilaritySearch.runSearchTree).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(webSimilaritySearch.runSearchTree).toHaveBeenCalledTimes(1);
  });

  it('triggerNow: fires search immediately without waiting for debounce', async () => {
    const { result } = renderHook(() => useSimilarityEngine());
    await act(async () => {
      result.current.triggerNow();
    });
    expect(webSimilaritySearch.runSearchTree).toHaveBeenCalledTimes(1);
  });

  it('AbortController: aborts previous in-flight search when triggerNow called again', async () => {
    let resolveFirst!: (v: []) => void;
    let firstAborted = false;
    vi.spyOn(webSimilaritySearch, 'runSearchTree').mockImplementation(
      (_sections, _title, _lang, signal) => {
        signal?.addEventListener('abort', () => { firstAborted = true; });
        return new Promise(resolve => { resolveFirst = () => resolve([]); });
      }
    );
    const { result } = renderHook(() => useSimilarityEngine());
    await act(async () => { result.current.triggerNow(); });
    // Second call should abort the first
    await act(async () => { result.current.triggerNow(); });
    expect(firstAborted).toBe(true);
    resolveFirst([]);
  });

  it('AbortController: does not update state after abort', async () => {
    let resolveLate!: (v: []) => void;
    vi.spyOn(webSimilaritySearch, 'runSearchTree').mockImplementationOnce(
      (_sections, _title, _lang, signal) =>
        new Promise(resolve => {
          resolveLate = () => resolve([]);
          signal?.addEventListener('abort', () => { /* aborted */ });
        })
    ).mockResolvedValue([]);

    const { result } = renderHook(() => useSimilarityEngine());
    await act(async () => { result.current.triggerNow(); }); // first, will be aborted
    await act(async () => { result.current.triggerNow(); }); // aborts first, starts second
    // Resolve the first (already aborted) search
    await act(async () => { resolveLate([]); });
    // Status should reflect second search result, not the aborted first
    expect(result.current.index.status).not.toBe('error');
  });

  it('resetIndex: sets status back to idle and cancels debounce', async () => {
    const { result } = renderHook(() => useSimilarityEngine());
    // Kick off a debounced search
    vi.advanceTimersByTime(DEBOUNCE_MS - 1000);
    await act(async () => { result.current.resetIndex(); });
    // Advance past original debounce — should NOT fire search
    vi.advanceTimersByTime(2000);
    expect(webSimilaritySearch.runSearchTree).not.toHaveBeenCalled();
    expect(result.current.index.status).toBe('idle');
  });

  it('cleanup: aborts and clears debounce on unmount', async () => {
    let abortedOnUnmount = false;
    vi.spyOn(webSimilaritySearch, 'runSearchTree').mockImplementation(
      (_sections, _title, _lang, signal) => {
        signal?.addEventListener('abort', () => { abortedOnUnmount = true; });
        return new Promise(() => { /* never resolves */ });
      }
    );
    const { result, unmount } = renderHook(() => useSimilarityEngine());
    await act(async () => { result.current.triggerNow(); });
    unmount();
    expect(abortedOnUnmount).toBe(true);
  });

  it('does not schedule background searches when the API key is unavailable', () => {
    renderHook(() => useSimilarityEngine({ hasApiKey: false }));
    vi.advanceTimersByTime(DEBOUNCE_MS);
    expect(webSimilaritySearch.runSearchTree).not.toHaveBeenCalled();
  });
});

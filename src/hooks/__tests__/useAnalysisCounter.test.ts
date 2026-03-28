/**
 * useAnalysisCounter — concurrent-ops counter tests
 *
 * Pure hook, no React context required. Tests drive beginAnalyzing /
 * endAnalyzing directly and assert on the observable isAnalyzing state.
 */
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAnalysisCounter } from '../useAnalysisCounter';

describe('useAnalysisCounter', () => {
  it('isAnalyzing starts as false', () => {
    const { result } = renderHook(() => useAnalysisCounter());
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('becomes true on begin, false on end (single op)', () => {
    const { result } = renderHook(() => useAnalysisCounter());

    act(() => { result.current.beginAnalyzing(); });
    expect(result.current.isAnalyzing).toBe(true);

    act(() => { result.current.endAnalyzing(); });
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('stays true while two overlapping ops are in progress', () => {
    const { result } = renderHook(() => useAnalysisCounter());

    act(() => { result.current.beginAnalyzing(); }); // counter = 1
    act(() => { result.current.beginAnalyzing(); }); // counter = 2
    act(() => { result.current.endAnalyzing(); });   // counter = 1 — still running
    expect(result.current.isAnalyzing).toBe(true);

    act(() => { result.current.endAnalyzing(); });   // counter = 0
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('never goes negative — excess endAnalyzing calls are clamped to 0', () => {
    const { result } = renderHook(() => useAnalysisCounter());

    act(() => { result.current.beginAnalyzing(); }); // counter = 1
    act(() => { result.current.endAnalyzing(); });   // counter = 0
    act(() => { result.current.endAnalyzing(); });   // excess → Math.max(0,-1) = 0
    act(() => { result.current.endAnalyzing(); });   // excess → still 0

    expect(result.current.isAnalyzing).toBe(false);
  });

  it('setIsAnalyzingForSubhook(true/false) routes to begin/end correctly', () => {
    const { result } = renderHook(() => useAnalysisCounter());

    act(() => { result.current.setIsAnalyzingForSubhook(true); });
    expect(result.current.isAnalyzing).toBe(true);

    act(() => { result.current.setIsAnalyzingForSubhook(false); });
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('sequential ops reset cleanly between runs', () => {
    const { result } = renderHook(() => useAnalysisCounter());

    // First op
    act(() => { result.current.beginAnalyzing(); });
    act(() => { result.current.endAnalyzing(); });
    expect(result.current.isAnalyzing).toBe(false);

    // Second op — counter must start from 0, not accumulate
    act(() => { result.current.beginAnalyzing(); });
    act(() => { result.current.endAnalyzing(); });
    expect(result.current.isAnalyzing).toBe(false);
  });
});

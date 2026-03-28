/**
 * useSongAnalysis — concurrent-ops counter tests
 *
 * Targets the activeAnalysisOpsRef guard in useSongAnalysis:
 * isAnalyzing must stay true until ALL concurrent operations complete,
 * and must never go negative when endAnalyzing is called in excess.
 *
 * Strategy: mount useSongAnalysis with a minimal mock environment and
 * directly drive beginAnalyzing / endAnalyzing via the exposed isAnalyzing
 * state, reflected through the analysisEngine and pasteImport sub-hooks.
 *
 * Because the concurrency counter is internal (not exported), we test it
 * indirectly through observable state changes — consistent with the
 * "test behaviour, not implementation" principle.
 */
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RefObject } from 'react';
import type { Section } from '../../types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSongCtx = {
  song: [] as Section[],
  structure: [] as string[],
  topic: '',
  mood: '',
  rhymeScheme: 'AABB',
  songLanguage: 'en',
  setSongLanguage: vi.fn(),
  detectedLanguages: [] as string[],
  setDetectedLanguages: vi.fn(),
  lineLanguages: {} as Record<string, string>,
  setLineLanguages: vi.fn(),
  setTopic: vi.fn(),
  setMood: vi.fn(),
};

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => mockSongCtx,
}));

// Minimal sub-hook mocks — we want to control setIsAnalyzing calls directly
let capturedSetIsAnalyzing: ((v: boolean) => void) | null = null;

vi.mock('../analysis/usePasteImport', () => ({
  usePasteImport: (params: { setIsAnalyzing: (v: boolean) => void }) => {
    capturedSetIsAnalyzing = params.setIsAnalyzing;
    return {
      canPasteLyrics: false,
      pastedText: '',
      setPastedText: vi.fn(),
      importProgress: null,
      analyzePastedLyrics: vi.fn(),
    };
  },
}));

vi.mock('../analysis/useLanguageAdapter', () => ({
  useLanguageAdapter: () => ({
    songLanguage: 'en',
    targetLanguage: 'en',
    setTargetLanguage: vi.fn(),
    sectionTargetLanguages: {},
    setSectionTargetLanguages: vi.fn(),
    isDetectingLanguage: false,
    isAdaptingLanguage: false,
    adaptationProgress: null,
    adaptationResult: null,
    detectLanguage: vi.fn(),
    adaptSongLanguage: vi.fn(),
    adaptSectionLanguage: vi.fn(),
  }),
}));

vi.mock('../analysis/useSongAnalysisEngine', () => ({
  useSongAnalysisEngine: (params: { setIsAnalyzing: (v: boolean) => void }) => {
    // Expose setter so tests can drive it
    capturedSetIsAnalyzing = params.setIsAnalyzing;
    return {
      isAnalyzingTheme: false,
      analysisReport: null,
      analysisSteps: [],
      appliedAnalysisItems: [],
      selectedAnalysisItems: [],
      isApplyingAnalysis: false,
      toggleAnalysisItemSelection: vi.fn(),
      applyAnalysisItem: vi.fn(),
      applySelectedAnalysisItems: vi.fn(),
      analyzeCurrentSong: vi.fn(),
      clearAppliedAnalysisItems: vi.fn(),
      analyzeLocalRhymes: vi.fn(),
    };
  },
}));

import { useSongAnalysis } from '../useSongAnalysis';

const makeParams = () => ({
  uiLanguage: 'en',
  isGeneratingRef: { current: false } as RefObject<boolean>,
  saveVersion: vi.fn(),
  updateState: vi.fn(),
  updateSongAndStructureWithHistory: vi.fn(),
  clearLineSelection: vi.fn(),
  requestAutoTitleGeneration: vi.fn(),
  setIsPasteModalOpen: vi.fn(),
  setIsAnalysisModalOpen: vi.fn(),
});

describe('useSongAnalysis — concurrent-ops counter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSetIsAnalyzing = null;
  });

  it('isAnalyzing starts as false', () => {
    const { result } = renderHook(() => useSongAnalysis(makeParams()));
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('becomes true when one op begins, false when it ends', () => {
    const { result } = renderHook(() => useSongAnalysis(makeParams()));
    expect(capturedSetIsAnalyzing).not.toBeNull();

    act(() => { capturedSetIsAnalyzing!(true); });
    expect(result.current.isAnalyzing).toBe(true);

    act(() => { capturedSetIsAnalyzing!(false); });
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('stays true while two overlapping ops are in progress', () => {
    const { result } = renderHook(() => useSongAnalysis(makeParams()));

    act(() => { capturedSetIsAnalyzing!(true); });  // op 1 begins
    act(() => { capturedSetIsAnalyzing!(true); });  // op 2 begins (counter = 2)
    act(() => { capturedSetIsAnalyzing!(false); }); // op 1 ends  (counter = 1)
    expect(result.current.isAnalyzing).toBe(true); // still running

    act(() => { capturedSetIsAnalyzing!(false); }); // op 2 ends  (counter = 0)
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('never goes negative — excess endAnalyzing calls are clamped to 0', () => {
    const { result } = renderHook(() => useSongAnalysis(makeParams()));

    act(() => { capturedSetIsAnalyzing!(true); });  // counter = 1
    act(() => { capturedSetIsAnalyzing!(false); }); // counter = 0
    act(() => { capturedSetIsAnalyzing!(false); }); // excess call → Math.max(0, -1) = 0
    act(() => { capturedSetIsAnalyzing!(false); }); // excess call → still 0

    // isAnalyzing must be false, not stuck in an invalid state
    expect(result.current.isAnalyzing).toBe(false);
  });
});

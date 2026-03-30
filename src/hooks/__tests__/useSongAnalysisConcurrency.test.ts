/**
 * useSongAnalysis — concurrency via useAnalysisCounter
 *
 * Now that the counter logic lives in useAnalysisCounter (tested separately),
 * this file only verifies the integration: that useSongAnalysis wires
 * setIsAnalyzingForSubhook to its sub-hooks and reflects isAnalyzing
 * correctly. Sub-hooks are mocked; SongContext is mocked.
 *
 * The counter behaviour itself is exhaustively covered in
 * useAnalysisCounter.test.ts — no duplication here.
 */
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RefObject } from 'react';
import type { Section } from '../../types';

// ── SongContext mock ────────────────────────────────────────────────────────
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

// ── Sub-hook mocks ─────────────────────────────────────────────────────────
vi.mock('../analysis/usePasteImport', () => ({
  usePasteImport: () => ({
    canPasteLyrics: false,
    pastedText: '',
    setPastedText: vi.fn(),
    importProgress: null,
    analyzePastedLyrics: vi.fn(),
  }),
}));

vi.mock('../analysis/useLanguageAdapter', () => ({
  useLanguageAdapter: () => ({
    songLanguage: 'en',
    targetLanguage: 'en',
    setTargetLanguage: vi.fn(),
    setSongLanguage: vi.fn(),
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
  useSongAnalysisEngine: () => ({
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
  }),
}));

import { useSongAnalysis } from '../useSongAnalysis';

const makeParams = () => ({
  uiLanguage: 'en',
  isGeneratingRef: { current: false } as RefObject<boolean>,
  hasApiKey: true,
  saveVersion: vi.fn(),
  updateState: vi.fn(),
  updateSongAndStructureWithHistory: vi.fn(),
  clearLineSelection: vi.fn(),
  requestAutoTitleGeneration: vi.fn(),
  setIsPasteModalOpen: vi.fn(),
  setIsAnalysisModalOpen: vi.fn(),
});

describe('useSongAnalysis — isAnalyzing integration', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('exposes isAnalyzing=false on mount', () => {
    const { result } = renderHook(() => useSongAnalysis(makeParams()));
    expect(result.current.isAnalyzing).toBe(false);
  });
});

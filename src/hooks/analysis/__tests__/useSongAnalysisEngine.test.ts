import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../../types';
import { useSongAnalysisEngine } from '../useSongAnalysisEngine';

const generateContentWithRetry = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', () => ({
  Type: {
    ARRAY: 'array',
    OBJECT: 'object',
    STRING: 'string',
    INTEGER: 'integer',
  },
}));

vi.mock('../../../utils/aiUtils', async () => {
  const actual = await vi.importActual<typeof import('../../../utils/aiUtils')>('../../../utils/aiUtils');

  return {
    ...actual,
    AI_MODEL_NAME: 'test-model',
    generateContentWithRetry,
  };
});

vi.mock('../useBackgroundThemeAnalysis', () => ({
  useBackgroundThemeAnalysis: () => ({ isAnalyzingTheme: false }),
}));

vi.mock('../../../utils/withAbort', () => ({
  withAbort: async (
    ref: { current: AbortController | null },
    callback: (signal: AbortSignal) => Promise<unknown>,
  ) => {
    const controller = new AbortController();
    ref.current = controller;
    return callback(controller.signal);
  },
  abortCurrent: vi.fn(),
  isAbortError: (error: unknown) => error instanceof DOMException && error.name === 'AbortError',
}));

const createSong = (): Section[] => [{
  id: 'section-1',
  name: 'Verse 1',
  rhymeScheme: 'AABB',
  lines: [{
    id: 'line-1',
    text: 'City lights are calling',
    rhymingSyllables: 'alling',
    rhyme: 'A',
    syllables: 6,
    concept: 'scene',
    isMeta: false,
  }],
}];

const createParams = (overrides: Partial<Parameters<typeof useSongAnalysisEngine>[0]> = {}) => ({
  song: createSong(),
  topic: 'Night drive',
  mood: 'Electric',
  uiLanguage: 'English',
  saveVersion: vi.fn(),
  updateSongAndStructureWithHistory: vi.fn(),
  setTopic: vi.fn(),
  setMood: vi.fn(),
  setIsAnalyzing: vi.fn(),
  setIsAnalysisModalOpen: vi.fn(),
  hasApiKey: true,
  ...overrides,
});

describe('useSongAnalysisEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sets and then clears isAnalyzing while analyzing the current song', async () => {
    let resolveAnalysis: ((value: { text: string }) => void) | undefined;
    generateContentWithRetry.mockImplementationOnce(() => new Promise(resolve => {
      resolveAnalysis = resolve;
    }));

    const params = createParams();
    const { result } = renderHook(() => useSongAnalysisEngine(params));

    act(() => {
      void result.current.analyzeCurrentSong();
    });

    expect(params.setIsAnalyzing).toHaveBeenNthCalledWith(1, true);
    expect(params.setIsAnalysisModalOpen).toHaveBeenCalledWith(true);

    await act(async () => {
      resolveAnalysis?.({
        text: JSON.stringify({
          theme: 'Nocturnal energy',
          emotionalArc: 'Rising',
          technicalAnalysis: ['Strong internal rhyme'],
          strengths: ['Clear imagery'],
          improvements: ['Tighten the bridge'],
          musicalSuggestions: ['Add a sparse intro'],
          summary: 'Solid draft',
        }),
      });
    });

    await waitFor(() => {
      expect(params.setIsAnalyzing).toHaveBeenLastCalledWith(false);
      expect(result.current.analysisReport).toEqual(expect.objectContaining({
        theme: 'Nocturnal energy',
      }));
    });
  });

  it('resets isAnalyzing when AI analysis fails', async () => {
    generateContentWithRetry.mockRejectedValueOnce(new Error('AI failure'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const params = createParams();
    const { result } = renderHook(() => useSongAnalysisEngine(params));

    await act(async () => {
      await result.current.analyzeCurrentSong();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(params.setIsAnalyzing).toHaveBeenNthCalledWith(1, true);
    expect(params.setIsAnalyzing).toHaveBeenLastCalledWith(false);
    expect(result.current.analysisSteps.at(-1)).toBe('Error during analysis. Please try again.');
  });

  it('toggles selected analysis items on and off', () => {
    const { result } = renderHook(() => useSongAnalysisEngine(createParams()));

    act(() => {
      result.current.toggleAnalysisItemSelection('Sharpen the first verse');
    });
    expect(result.current.selectedAnalysisItems).toEqual(new Set(['Sharpen the first verse']));

    act(() => {
      result.current.toggleAnalysisItemSelection('Sharpen the first verse');
    });
    expect(result.current.selectedAnalysisItems).toEqual(new Set());
  });

  it('applies selected analysis items and updates the transformed song', async () => {
    generateContentWithRetry.mockResolvedValueOnce({
      text: JSON.stringify([{
        name: 'Verse 1',
        rhymeScheme: 'ABAB',
        lines: [{
          text: 'Sharper city lights ignite',
          rhymingSyllables: 'ight',
          rhyme: 'A',
          syllables: 7,
          concept: 'improved scene',
        }],
      }]),
    });

    const params = createParams();
    const { result } = renderHook(() => useSongAnalysisEngine(params));

    act(() => {
      result.current.toggleAnalysisItemSelection('Tighten imagery');
    });

    await act(async () => {
      await result.current.applySelectedAnalysisItems();
    });

    expect(params.saveVersion).toHaveBeenCalledWith('Before Analysis Batch Improvements');
    expect(params.updateSongAndStructureWithHistory).toHaveBeenCalledWith(
      [expect.objectContaining({
        id: 'section-1',
        name: 'Verse 1',
        rhymeScheme: 'ABAB',
        lines: [expect.objectContaining({
          id: 'line-1',
          text: 'Sharper city lights ignite',
          concept: 'improved scene',
        })],
      })],
      ['Verse 1'],
    );
    expect(result.current.appliedAnalysisItems).toEqual(new Set(['Tighten imagery']));
    expect(result.current.selectedAnalysisItems).toEqual(new Set());
  });
});

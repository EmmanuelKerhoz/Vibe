import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useLanguageAdapter } from './useLanguageAdapter';
import { generateContentWithRetry } from '../../utils/aiUtils';
import { reverseTranslateLines, reviewTranslationFidelity } from '../../utils/llmPipelineUtils';
import { matchRhymeSchemeAcrossLang } from '../../utils/adaptationUtils';

const abortMocks = vi.hoisted(() => ({
  lastController: null as AbortController | null,
}));

vi.mock('../../utils/aiUtils', () => ({
  AI_MODEL_NAME: 'test-model',
  generateContentWithRetry: vi.fn(),
  safeJsonParse: <T,>(text: string, fallback: T): T => {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  },
}));

vi.mock('../../utils/llmPipelineUtils', () => ({
  reverseTranslateLines: vi.fn(),
  reviewTranslationFidelity: vi.fn(),
}));

vi.mock('../../utils/adaptationUtils', () => ({
  matchRhymeSchemeAcrossLang: vi.fn(),
}));

vi.mock('../../utils/withAbort', async () => {
  const actual = await vi.importActual<typeof import('../../utils/withAbort')>('../../utils/withAbort');
  return {
    ...actual,
    withAbort: vi.fn(async (ref, operation) => {
      ref.current?.abort();
      const controller = new AbortController();
      ref.current = controller;
      abortMocks.lastController = controller;
      return operation(controller.signal);
    }),
  };
});

const makeLine = (id: string, text: string) => ({
  id,
  text,
  rhymingSyllables: text.slice(-2),
  rhyme: '',
  syllables: text.split(/\s+/).length,
  concept: text,
  isMeta: false,
});

const makeSong = (sectionId: string, linePrefix: string): Section[] => [{
  id: sectionId,
  name: 'Verse 1',
  language: 'English',
  lines: [
    makeLine(`${linePrefix}-1`, `${linePrefix} first line`),
    makeLine(`${linePrefix}-2`, `${linePrefix} second line`),
  ],
}];

const buildAdaptationPayload = (label: string) => JSON.stringify([{
  name: `${label} Verse`,
  lines: [
    { text: `${label} first adapted line`, rhymingSyllables: 'ne', rhyme: 'A', syllables: 5, concept: 'first' },
    { text: `${label} second adapted line`, rhymingSyllables: 'ne', rhyme: 'A', syllables: 5, concept: 'second' },
  ],
}]);

const createParams = (song: Section[]) => ({
  song,
  uiLanguage: 'en',
  saveVersion: vi.fn(),
  updateSongAndStructureWithHistory: vi.fn(),
  updateState: vi.fn(),
  isGeneratingRef: { current: false },
  songLanguage: 'English',
  setSongLanguage: vi.fn(),
  detectedLanguages: ['English'],
  setDetectedLanguages: vi.fn(),
  lineLanguages: {} as Record<string, string>,
  setLineLanguages: vi.fn(),
  hasApiKey: true,
});

describe('useLanguageAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    abortMocks.lastController = null;
    vi.mocked(matchRhymeSchemeAcrossLang).mockResolvedValue({
      success: false,
      sourceScheme: '',
      targetScheme: '',
      constrainedPrompt: '',
      sourceAnalysis: [],
      error: 'not needed in these tests',
    });
    vi.mocked(reverseTranslateLines).mockResolvedValue(['back translated line 1', 'back translated line 2']);
    vi.mocked(reviewTranslationFidelity).mockResolvedValue({ score: 87, warnings: [] });
  });

  it('propagates AbortSignal and clears the adapting state without updating the song', async () => {
    const params = createParams(makeSong('section-a', 'source'));

    vi.mocked(generateContentWithRetry).mockImplementation(({ signal }) => new Promise((_, reject) => {
      signal?.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      );
    }));

    const { result } = renderHook(() => useLanguageAdapter(params));

    await act(async () => {
      const adaptationPromise = result.current.adaptSongLanguage('Spanish');
      abortMocks.lastController?.abort();
      await expect(adaptationPromise).resolves.toBeUndefined();
    });

    expect(result.current.isAdaptingLanguage).toBe(false);
    expect(result.current.adaptationResult).toBeNull();
    expect(params.updateSongAndStructureWithHistory).not.toHaveBeenCalled();
  });

  it('maps the winning result onto the frozen snapshot from the second song state', async () => {
    const firstSong = makeSong('section-a', 'first');
    const secondSong = makeSong('section-b', 'second');
    const params = createParams(firstSong);

    vi.mocked(generateContentWithRetry)
      .mockImplementationOnce(({ signal }) => new Promise((_, reject) => {
        signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      }))
      .mockResolvedValueOnce({ text: buildAdaptationPayload('second') });

    const { result, rerender } = renderHook(currentProps => useLanguageAdapter(currentProps), {
      initialProps: params,
    });

    let firstPromise: Promise<void> | undefined;
    await act(async () => {
      firstPromise = result.current.adaptSongLanguage('Spanish');
      await Promise.resolve();
    });

    rerender({ ...params, song: secondSong });

    await act(async () => {
      await result.current.adaptSongLanguage('German');
    });

    await act(async () => {
      await firstPromise?.catch(() => undefined);
    });

    expect(params.updateSongAndStructureWithHistory).toHaveBeenCalledTimes(1);
    const [adaptedSong] = vi.mocked(params.updateSongAndStructureWithHistory).mock.calls[0]!;
    expect(adaptedSong[0]?.id).toBe('section-b');
    expect(adaptedSong[0]?.lines[0]?.id).toBe('second-1');
    expect(adaptedSong[0]?.lines[1]?.id).toBe('second-2');
    expect(adaptedSong[0]?.name).toBe('second Verse');
  });

  it('falls back to a zero fidelity score with warnings when fidelity review is invalid or fails', async () => {
    const params = createParams(makeSong('section-a', 'source'));
    vi.mocked(generateContentWithRetry).mockResolvedValue({ text: buildAdaptationPayload('fallback') });
    vi.mocked(reviewTranslationFidelity).mockResolvedValueOnce('' as never);

    const { result } = renderHook(() => useLanguageAdapter(params));

    await act(async () => {
      await result.current.adaptSongLanguage('Spanish');
    });

    expect(result.current.adaptationResult?.score).toBe(0);
    expect(result.current.adaptationResult?.warnings.length).toBeGreaterThan(0);
    expect(result.current.adaptationResult?.accepted).toBe(false);
  });

  it('completes an end-to-end adaptation with populated song data and positive fidelity', async () => {
    const params = createParams(makeSong('section-a', 'source'));
    vi.mocked(generateContentWithRetry).mockResolvedValue({ text: buildAdaptationPayload('happy') });
    vi.mocked(reviewTranslationFidelity).mockResolvedValueOnce({ score: 91, warnings: ['minor image shift'] });

    const { result } = renderHook(() => useLanguageAdapter(params));

    await act(async () => {
      await result.current.adaptSongLanguage('Spanish');
    });

    expect(params.updateSongAndStructureWithHistory).toHaveBeenCalledTimes(1);
    const [adaptedSong, structure] = vi.mocked(params.updateSongAndStructureWithHistory).mock.calls[0]!;
    expect(adaptedSong[0]?.lines[0]?.text).toContain('happy first adapted line');
    expect(structure).toEqual(['happy Verse']);
    expect(result.current.isAdaptingLanguage).toBe(false);
    expect(result.current.adaptationResult?.score).toBeGreaterThan(0);
  });
});

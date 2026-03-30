import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useSuggestions } from './useSuggestions';

const generateContentWithRetry = vi.hoisted(() => vi.fn());

vi.mock('../../utils/aiUtils', () => ({
  AI_MODEL_NAME: 'test-model',
  generateContentWithRetry,
  safeJsonParse: <T,>(text: string, fallback: T): T => {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  },
  handleApiError: vi.fn(),
}));

vi.mock('../../utils/withAbort', () => ({
  withAbort: async (
    ref: { current: AbortController | null },
    callback: (signal: AbortSignal) => Promise<unknown>,
  ) => {
    const controller = new AbortController();
    ref.current = controller;
    return callback(controller.signal);
  },
  isAbortError: () => false,
}));

const song: Section[] = [{
  id: 'section-1',
  name: 'Verse 1',
  rhymeScheme: 'AABB',
  lines: [
    {
      id: 'line-1',
      text: 'Moonlight on the avenue',
      rhymingSyllables: '',
      rhyme: '',
      syllables: 6,
      concept: 'scene',
      isMeta: false,
    },
    {
      id: 'line-2',
      text: 'Heartbeat racing into view',
      rhymingSyllables: '',
      rhyme: '',
      syllables: 7,
      concept: 'motion',
      isMeta: false,
    },
  ],
}];

describe('useSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateContentWithRetry.mockResolvedValue({ text: '["Alternative 1","Alternative 2","Alternative 3"]' });
  });

  it('injects an exclusive song-language instruction into suggestion prompts when provided', async () => {
    const { result } = renderHook(() => useSuggestions({
      song,
      topic: 'Night drive',
      mood: 'Electric',
      rhymeScheme: 'AABB',
      targetSyllables: 8,
      songLanguage: 'Arabic',
      hasApiKey: true,
      selectedLineId: 'line-2',
      updateState: vi.fn(),
    }));

    await act(async () => {
      await result.current.generateSuggestions('line-2');
    });

    expect(generateContentWithRetry).toHaveBeenCalledTimes(1);
    const prompt = String(generateContentWithRetry.mock.calls[0]?.[0]?.contents ?? '');
    expect(prompt).toContain('IMPORTANT: All 3 alternatives MUST be written in Arabic.');
    expect(prompt).toContain('Write exclusively in Arabic.');
  });

  it('does not generate suggestions when the API key is unavailable', async () => {
    const { result } = renderHook(() => useSuggestions({
      song,
      topic: 'Night drive',
      mood: 'Electric',
      rhymeScheme: 'AABB',
      targetSyllables: 8,
      songLanguage: 'Arabic',
      hasApiKey: false,
      selectedLineId: 'line-2',
      updateState: vi.fn(),
    }));

    await act(async () => {
      await result.current.generateSuggestions('line-2');
    });

    expect(generateContentWithRetry).not.toHaveBeenCalled();
    expect(result.current.isSuggesting).toBe(false);
    expect(result.current.suggestions).toEqual([]);
  });
});

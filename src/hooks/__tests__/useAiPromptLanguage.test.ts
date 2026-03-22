import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';

const aiUtilsMocks = vi.hoisted(() => ({
  generateContentWithRetry: vi.fn(async () => ({ text: 'Generated output' })),
  handleApiError: vi.fn(),
}));

vi.mock('../../utils/aiUtils', () => ({
  AI_MODEL_NAME: 'test-model',
  generateContentWithRetry: aiUtilsMocks.generateContentWithRetry,
  safeJsonParse: <T,>(text: string, fallback: T) => {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  },
  handleApiError: aiUtilsMocks.handleApiError,
}));

import { useTitleGenerator } from '../useTitleGenerator';
import { useTopicMoodSuggester } from '../useTopicMoodSuggester';

const song: Section[] = [{
  id: 'section-1',
  name: 'Verse 1',
  lines: [{
    id: 'line-1',
    text: 'Neon lights are calling me home',
    rhymingSyllables: '',
    rhyme: '',
    syllables: 0,
    concept: 'line',
  }],
}];

const getPromptAt = (index: number): string =>
  (((aiUtilsMocks.generateContentWithRetry.mock.calls as unknown as Array<[{ contents?: string }]>)[index]?.[0]?.contents) ?? '');

describe('AI prompt language enforcement', () => {
  beforeEach(() => {
    aiUtilsMocks.generateContentWithRetry.mockClear();
    aiUtilsMocks.handleApiError.mockClear();
  });

  it('adds an exclusive language instruction to title generation only when songLanguage is set', async () => {
    const { result, rerender } = renderHook(
      ({ language }) => useTitleGenerator(song, 'night drive', 'moody', language),
      { initialProps: { language: 'Arabic' } },
    );

    await act(async () => {
      await result.current.generateTitle();
    });

    expect(aiUtilsMocks.generateContentWithRetry).toHaveBeenCalled();
    const firstPrompt = getPromptAt(0);
    expect(firstPrompt).toContain('Respond exclusively in Arabic');

    rerender({ language: '' });
    await act(async () => {
      await result.current.generateTitle();
    });

    const secondPrompt = getPromptAt(1);
    expect(secondPrompt).not.toContain('Respond exclusively in');
  });

  it('adds an exclusive language instruction to topic/mood suggestions only when songLanguage is set', async () => {
    aiUtilsMocks.generateContentWithRetry.mockResolvedValueOnce({ text: '{"topic":"Ville","mood":"Brumeux"}' });
    const { result, rerender } = renderHook(
      ({ language }) => useTopicMoodSuggester('Existing topic', 'Existing mood', language, vi.fn(), vi.fn()),
      { initialProps: { language: 'French' } },
    );

    await act(async () => {
      await result.current.generateSuggestion();
    });

    const firstPrompt = getPromptAt(0);
    expect(firstPrompt).toContain('write the "topic" and "mood" values exclusively in French');

    aiUtilsMocks.generateContentWithRetry.mockResolvedValueOnce({ text: '{"topic":"City","mood":"Moody"}' });
    rerender({ language: '' });
    await act(async () => {
      await result.current.generateSuggestion();
    });

    const secondPrompt = getPromptAt(1);
    expect(secondPrompt).not.toContain('values exclusively in');
  });
});

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useMusicalPrompt } from './useMusicalPrompt';

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
  lines: [{
    id: 'line-1',
    text: 'Sous les néons je rêve encore',
    rhymingSyllables: '',
    rhyme: '',
    syllables: 7,
    concept: 'rêve',
    isMeta: false,
  }],
}];

describe('useMusicalPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateContentWithRetry
      .mockResolvedValueOnce({ text: 'STYLE: French chanson pop' })
      .mockResolvedValueOnce({
        text: '{"genre":"French chanson","tempo":"92","instrumentation":"Piano","rhythm":"Waltz pulse","narrative":"Bittersweet rise"}',
      });
  });

  it('adds a language-driven cultural lens to musical prompt and analysis requests', async () => {
    const params = {
      song,
      title: 'Nuit claire',
      topic: 'City lights',
      mood: 'Romantic',
      genre: '',
      tempo: '92',
      instrumentation: '',
      rhythm: '',
      narrative: '',
      songLanguage: 'French',
      setMusicalPrompt: vi.fn(),
      setGenre: vi.fn(),
      setTempo: vi.fn(),
      setInstrumentation: vi.fn(),
      setRhythm: vi.fn(),
      setNarrative: vi.fn(),
    };

    const { result } = renderHook(() => useMusicalPrompt(params));

    await act(async () => {
      await result.current.generateMusicalPrompt();
      await result.current.analyzeLyricsForMusic();
    });

    const promptRequest = String(generateContentWithRetry.mock.calls[0]?.[0]?.contents ?? '');
    const analysisRequest = String(generateContentWithRetry.mock.calls[1]?.[0]?.contents ?? '');

    expect(promptRequest).toContain('Treat French as a cultural style lens');
    expect(promptRequest).toContain('LANGUAGE/CULTURAL LENS:');
    expect(analysisRequest).toContain('Use French as a cultural context clue');
  });
});

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useAiGeneration } from './useAiGeneration';

const generateContent = vi.hoisted(() => vi.fn());

vi.mock('../../utils/aiUtils', () => ({
  AI_MODEL_NAME: 'test-model',
  getAi: () => ({
    models: {
      generateContent,
    },
  }),
  safeJsonParse: <T,>(text: string, fallback: T): T => {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  },
  handleApiError: vi.fn(),
}));

vi.mock('../../utils/withRetry', () => ({
  withRetry: async <T,>(fn: () => Promise<T>) => fn(),
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

const makeSong = (): Section[] => [{
  id: 'section-1',
  name: 'Verse',
  rhymeScheme: 'AABB',
  lines: [{
    id: 'line-1',
    text: 'Current line',
    rhymingSyllables: 'ine',
    rhyme: 'A',
    syllables: 3,
    concept: 'current',
    isMeta: false,
  }],
}];

const createResponse = () => JSON.stringify([{
  name: 'Verse',
  rhymeScheme: 'AABB',
  lines: [{
    text: 'Nouvelle ligne',
    rhymingSyllables: 'igne',
    rhyme: 'A',
    syllables: 3,
    concept: 'nouveau',
  }],
}]);

describe('useAiGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateContent.mockResolvedValue({ text: createResponse() });
  });

  it('adds an exclusive song-language instruction to generation, regeneration, and syllable quantization prompts', async () => {
    const song = makeSong();
    const params = {
      song,
      structure: ['Verse'],
      topic: 'Night drive',
      mood: 'Moody',
      rhymeScheme: 'AABB',
      targetSyllables: 8,
      title: 'Midnight',
      songLanguage: 'French',
      uiLanguage: 'English',
      updateState: vi.fn((
        recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] },
      ) => recipe({ song, structure: ['Verse'] })),
      updateSongWithHistory: vi.fn(),
      updateSongAndStructureWithHistory: vi.fn(),
      requestAutoTitleGeneration: vi.fn(),
      setSelectedLineId: vi.fn(),
    };

    const { result } = renderHook(() => useAiGeneration(params));

    await act(async () => {
      await result.current.generateSong();
      await result.current.regenerateSection('section-1');
      await result.current.quantizeSyllables('section-1');
    });

    const prompts = generateContent.mock.calls.map(call => String(call[0]?.contents ?? ''));
    expect(prompts).toHaveLength(3);
    prompts.forEach(prompt => {
      expect(prompt).toContain('Write exclusively in French.');
    });
  });

  it('assigns ids to generated sections and lines when the AI response omits them', async () => {
    const song = makeSong();
    const updateSongAndStructureWithHistory = vi.fn();
    const params = {
      song,
      structure: ['Verse'],
      topic: 'Night drive',
      mood: 'Moody',
      rhymeScheme: 'AABB',
      targetSyllables: 8,
      title: 'Midnight',
      songLanguage: 'French',
      uiLanguage: 'English',
      updateState: vi.fn((
        recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] },
      ) => recipe({ song, structure: ['Verse'] })),
      updateSongWithHistory: vi.fn(),
      updateSongAndStructureWithHistory,
      requestAutoTitleGeneration: vi.fn(),
      setSelectedLineId: vi.fn(),
    };

    const { result } = renderHook(() => useAiGeneration(params));

    await act(async () => {
      await result.current.generateSong();
    });

    expect(updateSongAndStructureWithHistory).toHaveBeenCalledTimes(1);
    const generatedSongCall = updateSongAndStructureWithHistory.mock.calls[0];
    expect(generatedSongCall).toBeDefined();
    const generatedSong = generatedSongCall?.[0] as Section[];
    expect(generatedSong).toHaveLength(1);
    expect(generatedSong[0]?.id).toEqual(expect.any(String));
    expect(generatedSong[0]?.lines[0]?.id).toEqual(expect.any(String));
    expect(generatedSong[0]?.lines[0]?.text).toBe('Nouvelle ligne');
  });
});

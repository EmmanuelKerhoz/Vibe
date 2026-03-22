import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';

const composerAiMocks = vi.hoisted(() => {
  const generateContent = vi.fn(async ({ contents }: { contents?: string }) => {
    if (typeof contents === 'string' && contents.includes('Generate a structured musical production prompt')) {
      return { text: 'STYLE: synth-pop\nMOOD: shimmering' };
    }

    return {
      text: JSON.stringify([{
        name: 'Verse 1',
        rhymeScheme: 'AABB',
        lines: [
          {
            text: 'Bonjour la nuit',
            rhymingSyllables: 'uit',
            rhyme: 'A',
            syllables: 4,
            concept: 'night',
          },
        ],
      }]),
    };
  });

  const generateContentWithRetry = vi.fn(async ({ contents }: { contents?: string }) => {
    if (typeof contents === 'string' && contents.includes('Generate 3 creative alternative versions')) {
      return { text: '["Primera opción","Segunda opción","Tercera opción"]' };
    }

    if (typeof contents === 'string' && contents.includes('Generate a structured musical production prompt')) {
      return { text: 'STYLE: synth-pop\nMOOD: shimmering' };
    }

    if (typeof contents === 'string' && contents.includes('provide JSON with exactly these keys')) {
      return {
        text: '{"genre":"French pop","tempo":"120","instrumentation":"Piano","rhythm":"Steady pulse","narrative":"Builds softly"}',
      };
    }

    return { text: 'Generated output' };
  });

  return {
    generateContent,
    generateContentWithRetry,
    handleApiError: vi.fn(),
  };
});

vi.mock('../../utils/aiUtils', () => ({
  AI_MODEL_NAME: 'test-model',
  getAi: () => ({
    models: {
      generateContent: composerAiMocks.generateContent,
    },
  }),
  generateContentWithRetry: composerAiMocks.generateContentWithRetry,
  safeJsonParse: <T,>(text: string, fallback: T): T => {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  },
  handleApiError: composerAiMocks.handleApiError,
}));

vi.mock('../../utils/withAbort', () => ({
  withAbort: async (
    ref: { current: AbortController | null },
    callback: (signal: AbortSignal) => Promise<void>,
  ) => {
    const controller = new AbortController();
    ref.current = controller;
    await callback(controller.signal);
  },
  isAbortError: () => false,
  abortCurrent: (ref: { current: AbortController | null }) => ref.current?.abort(),
}));

vi.mock('../../utils/withRetry', () => ({
  withRetry: async <T,>(fn: () => Promise<T>) => fn(),
}));

import { useAiGeneration } from './useAiGeneration';
import { useSuggestions } from './useSuggestions';
import { useMusicalPrompt } from './useMusicalPrompt';

const song: Section[] = [{
  id: 'section-1',
  name: 'Verse 1',
  language: 'fr',
  rhymeScheme: 'AABB',
  lines: [
    {
      id: 'line-1',
      text: 'Salut la ville',
      rhymingSyllables: 'ille',
      rhyme: '',
      syllables: 4,
      concept: 'city',
    },
    {
      id: 'line-2',
      text: 'Je cherche un signe',
      rhymingSyllables: 'igne',
      rhyme: '',
      syllables: 5,
      concept: 'sign',
    },
  ],
}];

describe('composer prompt language enforcement', () => {
  beforeEach(() => {
    composerAiMocks.generateContent.mockClear();
    composerAiMocks.generateContentWithRetry.mockClear();
    composerAiMocks.handleApiError.mockClear();
  });

  it('injects the explicit song language into song generation, section regeneration, and syllable quantization prompts', async () => {
    const { result } = renderHook(() => useAiGeneration({
      song,
      structure: ['Verse 1'],
      topic: 'Night drive',
      mood: 'Reflective',
      rhymeScheme: 'AABB',
      targetSyllables: 8,
      title: 'City Lights',
      songLanguage: 'French',
      uiLanguage: 'English',
      updateState: vi.fn(),
      updateSongWithHistory: vi.fn(),
      updateSongAndStructureWithHistory: vi.fn(),
      requestAutoTitleGeneration: vi.fn(),
      setSelectedLineId: vi.fn(),
    }));

    await act(async () => {
      await result.current.generateSong();
      await result.current.regenerateSection('section-1');
      await result.current.quantizeSyllables('section-1');
    });

    const prompts = composerAiMocks.generateContent.mock.calls.map(
      ([request]: [{ contents?: string }]) => request.contents ?? '',
    );

    expect(prompts).toHaveLength(3);
    prompts.forEach(prompt => {
      expect(prompt).toContain('Song Language: French');
      expect(prompt).toContain('Write ALL lyrics in French');
    });
  });

  it('generates line suggestions in the song language', async () => {
    const { result } = renderHook(() => useSuggestions({
      song,
      topic: 'Midnight city',
      mood: 'Dreamy',
      rhymeScheme: 'AABB',
      targetSyllables: 8,
      songLanguage: 'Spanish',
      selectedLineId: 'line-1',
      updateState: vi.fn(),
    }));

    await act(async () => {
      await result.current.generateSuggestions('line-1');
    });

    const prompt = (((composerAiMocks.generateContentWithRetry.mock.calls as Array<[{ contents?: string }]>)?.[0]?.[0]?.contents) ?? '');
    expect(prompt).toContain('Song Output Language: Spanish');
    expect(prompt).toContain('IMPORTANT: All 3 alternatives MUST be written in Spanish.');
  });

  it('ensures generated musical prompts carry the song language in the style line', async () => {
    const setMusicalPrompt = vi.fn();
    const { result } = renderHook(() => useMusicalPrompt({
      song,
      title: 'Paris la nuit',
      topic: 'Night drive',
      mood: 'Romantic',
      genre: 'Pop',
      tempo: '118',
      instrumentation: 'Synths',
      rhythm: 'Steady',
      narrative: 'Glowing streets',
      songLanguage: 'French',
      setMusicalPrompt,
      setGenre: vi.fn(),
      setTempo: vi.fn(),
      setInstrumentation: vi.fn(),
      setRhythm: vi.fn(),
      setNarrative: vi.fn(),
    }));

    await act(async () => {
      await result.current.generateMusicalPrompt();
    });

    expect(composerAiMocks.generateContentWithRetry).toHaveBeenCalled();
    const prompt = (((composerAiMocks.generateContentWithRetry.mock.calls as Array<[{ contents?: string }]>)?.[0]?.[0]?.contents) ?? '');
    expect(prompt).toContain('Song Language: French');
    expect(prompt).toContain('"French chanson"');
    expect(setMusicalPrompt).toHaveBeenCalledWith(expect.stringContaining('STYLE: French synth-pop'));
  });
});

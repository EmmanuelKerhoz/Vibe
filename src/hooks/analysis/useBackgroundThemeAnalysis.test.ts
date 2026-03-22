import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useBackgroundThemeAnalysis } from './useBackgroundThemeAnalysis';
import { buildThemeAnalysisPrompt } from '../../utils/promptUtils';
import { generateContentWithRetry } from '../../utils/aiUtils';

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
  handleApiError: vi.fn(),
}));

vi.mock('../../utils/promptUtils', () => ({
  buildThemeAnalysisPrompt: vi.fn(() => 'theme-analysis-prompt'),
}));

const makeLine = (id: string, text: string) => ({
  id,
  text,
  rhymingSyllables: '',
  rhyme: '',
  syllables: text.split(/\s+/).length,
  concept: text,
  isMeta: false,
});

const makeSection = (id: string, name: string, language: string, lines: string[]): Section => ({
  id,
  name,
  language,
  lines: lines.map((line, index) => makeLine(`${id}-${index + 1}`, line)),
});

describe('useBackgroundThemeAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(generateContentWithRetry).mockResolvedValue({
      text: '{"topic":"City lights","mood":"Reflective"}',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces the background theme analysis and applies returned topic and mood updates', async () => {
    const song = [
      makeSection('verse-1', 'Verse 1', 'fr', [
        'Je roule encore sous les néons',
        'Le cœur s’attarde dans le son',
      ]),
    ];
    const setTopic = vi.fn();
    const setMood = vi.fn();

    const { result } = renderHook(() => useBackgroundThemeAnalysis({
      song,
      topic: 'Night ride',
      mood: 'Moody',
      uiLanguage: 'French',
      setTopic,
      setMood,
    }));

    expect(result.current.isAnalyzingTheme).toBe(false);
    expect(generateContentWithRetry).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2999);
    });

    expect(generateContentWithRetry).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(generateContentWithRetry).toHaveBeenCalledTimes(1);
    expect(buildThemeAnalysisPrompt).toHaveBeenCalledWith({
      song,
      topic: 'Night ride',
      mood: 'Moody',
      uiLanguage: 'French',
    });
    expect(setTopic).toHaveBeenCalledWith('City lights');
    expect(setMood).toHaveBeenCalledWith('Reflective');
    expect(result.current.isAnalyzingTheme).toBe(false);
  });

  it('defaults the analysis response language to English when uiLanguage is omitted', async () => {
    const song = [
      makeSection('verse-2', 'Verse 1', 'ko', [
        '네온 아래 걷는 밤',
        '조용히 번지는 맘',
      ]),
    ];

    renderHook(() => useBackgroundThemeAnalysis({
      song,
      topic: 'Neon night',
      mood: 'Dreamy',
      setTopic: vi.fn(),
      setMood: vi.fn(),
    }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(buildThemeAnalysisPrompt).toHaveBeenLastCalledWith({
      song,
      topic: 'Neon night',
      mood: 'Dreamy',
      uiLanguage: 'English',
    });
  });
});

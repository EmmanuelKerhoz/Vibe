import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { useSongAnalysisEngine } from './useSongAnalysisEngine';
import { compareTextsWithIPA } from '../../utils/ipaPipeline';

vi.mock('../../utils/ipaPipeline', () => ({
  compareTextsWithIPA: vi.fn(),
}));

vi.mock('../../utils/aiUtils', () => ({
  AI_MODEL_NAME: 'test-model',
  generateContentWithRetry: vi.fn().mockResolvedValue({ text: '{}' }),
  safeJsonParse: <T,>(text: string, fallback: T): T => {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  },
  handleApiError: vi.fn(),
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

const createParams = (song: Section[]) => ({
  song,
  topic: 'Night ride',
  mood: 'Moody',
  uiLanguage: 'fr',
  saveVersion: vi.fn(),
  updateSongAndStructureWithHistory: vi.fn(),
  setTopic: vi.fn(),
  setMood: vi.fn(),
  setIsAnalyzing: vi.fn(),
});

describe('useSongAnalysisEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the IPA pipeline by default for supported languages', async () => {
    vi.mocked(compareTextsWithIPA).mockResolvedValue({
      score: 0.91,
      quality: 'rich',
      distance: 0.09,
      method: 'feature-weighted',
    });

    const song = [
      makeSection('fr-verse', 'Verse 1', 'fr', [
        'Dans la nuit je marche encore',
        'Sous la pluie je cherche l’or',
        'Le matin réveille le port',
        'Ton parfum traverse le décor',
      ]),
    ];

    const { result } = renderHook(() => useSongAnalysisEngine(createParams(song)));
    const localRhymeAnalysis = await result.current.analyzeLocalRhymes();

    expect(compareTextsWithIPA).toHaveBeenCalled();
    expect(localRhymeAnalysis[0]?.mode).toBe('ipa');
    expect(localRhymeAnalysis[0]?.pairs.length).toBeGreaterThan(0);
  });

  it('downgrades the confidence score when a rhyme pair is approximated', async () => {
    vi.mocked(compareTextsWithIPA)
      .mockResolvedValueOnce({
        score: 0.8,
        quality: 'sufficient',
        distance: 0.2,
        method: 'feature-weighted',
      })
      .mockResolvedValueOnce({
        score: 0.8,
        quality: 'sufficient',
        distance: 0.2,
        method: 'feature-weighted',
        isApproximated: true,
      } as never);

    const song = [
      makeSection('section-a', 'Verse 1', 'fr', [
        'Premier reflet sur la Seine',
        'Dernier secret dans la Seine',
      ]),
      makeSection('section-b', 'Verse 2', 'fr', [
        'Le moteur gronde au matin',
        'Le décor tremble au matin',
      ]),
    ];

    const { result } = renderHook(() => useSongAnalysisEngine(createParams(song)));
    const [exactSection, approximatedSection] = await result.current.analyzeLocalRhymes();

    expect(exactSection?.pairs[0]?.confidenceScore).toBeGreaterThan(
      approximatedSection?.pairs[0]?.confidenceScore ?? 0,
    );
  });

  it('falls back gracefully to graphemic analysis for unsupported languages', async () => {
    const song = [
      makeSection('section-x', 'Verse 1', 'xyz', [
        'nara bela sona',
        'tari mela kona',
      ]),
    ];

    const { result } = renderHook(() => useSongAnalysisEngine(createParams(song)));

    await expect(result.current.analyzeLocalRhymes()).resolves.toEqual([
      expect.objectContaining({
        sectionId: 'section-x',
        mode: 'graphemic',
      }),
    ]);
    expect(compareTextsWithIPA).not.toHaveBeenCalled();
  });
});

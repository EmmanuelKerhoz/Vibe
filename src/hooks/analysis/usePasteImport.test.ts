import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { usePasteImport } from './usePasteImport';
import { generateContentWithRetry, handleApiError } from '../../utils/aiUtils';

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

const makeResponse = (overrides?: Record<string, unknown>) => ({
  text: JSON.stringify({
    topic: 'amour',
    mood: 'nostalgie',
    language: 'fr',
    sections: [
      {
        name: 'Verse 1',
        rhymeScheme: 'AABB',
        lines: [
          { text: 'Première ligne', rhymingSyllables: 'gne', rhyme: 'A', syllables: 4, concept: 'première' },
          { text: 'Deuxième ligne', rhymingSyllables: 'gne', rhyme: 'A', syllables: 4, concept: 'deuxième' },
          { text: 'Troisième ligne', rhymingSyllables: 'gne', rhyme: 'B', syllables: 4, concept: 'troisième' },
          { text: 'Quatrième ligne', rhymingSyllables: 'gne', rhyme: 'B', syllables: 4, concept: 'quatrième' },
        ],
      },
      {
        name: 'Chorus',
        rhymeScheme: 'AABB',
        lines: [
          { text: 'Refrain un', rhymingSyllables: 'un', rhyme: 'A', syllables: 3, concept: 'refrain' },
          { text: 'Refrain deux', rhymingSyllables: 'eux', rhyme: 'A', syllables: 3, concept: 'refrain' },
          { text: 'Refrain trois', rhymingSyllables: 'ois', rhyme: 'B', syllables: 3, concept: 'refrain' },
          { text: 'Refrain quatre', rhymingSyllables: 'atre', rhyme: 'B', syllables: 3, concept: 'refrain' },
        ],
      },
    ],
    ...overrides,
  }),
});

const createParams = () => ({
  rhymeScheme: 'AABB',
  uiLanguage: 'fr',
  updateSongAndStructureWithHistory: vi.fn(),
  setTopic: vi.fn(),
  setMood: vi.fn(),
  currentSongLanguage: '',
  onLanguageMismatch: vi.fn(),
  requestAutoTitleGeneration: vi.fn(),
  clearLineSelection: vi.fn(),
  setIsAnalyzing: vi.fn(),
  setIsPasteModalOpen: vi.fn(),
});

describe('usePasteImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('imports standard multiline lyrics into two sections with the expected line distribution', async () => {
    const params = createParams();
    vi.mocked(generateContentWithRetry).mockResolvedValue(makeResponse());

    const { result } = renderHook(() => usePasteImport(params));

    act(() => {
      result.current.setPastedText(
        'Première ligne\nDeuxième ligne\nTroisième ligne\nQuatrième ligne\n\nRefrain un\nRefrain deux\nRefrain trois\nRefrain quatre',
      );
    });

    await act(async () => {
      await result.current.analyzePastedLyrics();
    });

    expect(params.updateSongAndStructureWithHistory).toHaveBeenCalledTimes(1);
    const [song, structure] = vi.mocked(params.updateSongAndStructureWithHistory).mock.calls[0]!;
    expect(song).toHaveLength(2);
    expect(song[0]?.lines).toHaveLength(4);
    expect(song[1]?.lines).toHaveLength(4);
    expect(structure).toEqual(['Verse 1', 'Chorus']);
  });

  it('surfaces a language mismatch without auto-updating the current song language', async () => {
    const params = {
      ...createParams(),
      currentSongLanguage: 'English',
    };
    vi.mocked(generateContentWithRetry)
      .mockResolvedValueOnce(makeResponse({ language: 'French' }))
      .mockResolvedValueOnce({ text: 'French' });

    const { result } = renderHook(() => usePasteImport(params));

    act(() => {
      result.current.setPastedText('Je marche encore\nSous la pluie');
    });

    await act(async () => {
      await result.current.analyzePastedLyrics();
    });

    expect(params.onLanguageMismatch).toHaveBeenCalledWith('French');
  });

  it('ignores an empty import without throwing or changing state', async () => {
    const params = createParams();
    const { result } = renderHook(() => usePasteImport(params));

    await act(async () => {
      await expect(result.current.analyzePastedLyrics()).resolves.toBeUndefined();
    });

    expect(generateContentWithRetry).not.toHaveBeenCalled();
    expect(params.updateSongAndStructureWithHistory).not.toHaveBeenCalled();
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it('preserves existing markup-based sections without duplicating their tags as lyric lines', async () => {
    const params = createParams();
    vi.mocked(generateContentWithRetry).mockResolvedValue(makeResponse({
      sections: [
        {
          name: 'Verse',
          rhymeScheme: 'AABB',
          lines: [
            { text: 'Sous les néons on avance', rhymingSyllables: 'ance', rhyme: 'A', syllables: 6, concept: 'marche' },
            { text: 'La ville entière est immense', rhymingSyllables: 'ense', rhyme: 'A', syllables: 6, concept: 'ville' },
          ],
        },
        {
          name: 'Chorus',
          rhymeScheme: 'AABB',
          lines: [
            { text: 'Nos voix se répondent', rhymingSyllables: 'onde', rhyme: 'B', syllables: 5, concept: 'voix' },
            { text: 'Les ombres nous inondent', rhymingSyllables: 'onde', rhyme: 'B', syllables: 5, concept: 'ombre' },
          ],
        },
      ],
    }));

    const { result } = renderHook(() => usePasteImport(params));

    act(() => {
      result.current.setPastedText('[Couplet]\nSous les néons on avance\nLa ville entière est immense\n\n[Refrain]\nNos voix se répondent\nLes ombres nous inondent');
    });

    await act(async () => {
      await result.current.analyzePastedLyrics();
    });

    const [song] = vi.mocked(params.updateSongAndStructureWithHistory).mock.calls[0]!;
    const importedTexts = song.flatMap((section: Section) => section.lines.map(line => line.text));
    expect(importedTexts).not.toContain('[Couplet]');
    expect(importedTexts).not.toContain('[Refrain]');
    expect(song.map((section: Section) => section.name)).toEqual(['Verse', 'Chorus']);
  });
});

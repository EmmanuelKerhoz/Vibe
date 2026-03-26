import { act, renderHook, waitFor } from '@testing-library/react';
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

const makeSectionResponse = (overrides?: Record<string, unknown>) => ({
  text: JSON.stringify({
    name: 'Verse 1',
    rhymeScheme: 'AABB',
    lines: [
      { text: 'Première ligne', rhymingSyllables: 'gne', rhyme: 'A', syllables: 4, concept: 'première' },
      { text: 'Deuxième ligne', rhymingSyllables: 'gne', rhyme: 'A', syllables: 4, concept: 'deuxième' },
      { text: 'Troisième ligne', rhymingSyllables: 'gne', rhyme: 'B', syllables: 4, concept: 'troisième' },
      { text: 'Quatrième ligne', rhymingSyllables: 'gne', rhyme: 'B', syllables: 4, concept: 'quatrième' },
    ],
    ...overrides,
  }),
});

const makeMetadataResponse = (overrides?: Record<string, unknown>) => ({
  text: JSON.stringify({
    topic: 'amour',
    mood: 'nostalgie',
    language: 'French',
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
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: vi.fn().mockResolvedValue(''),
      },
    });
  });

  it('imports standard multiline lyrics into two sections with the expected line distribution', async () => {
    const params = createParams();
    vi.mocked(generateContentWithRetry)
      .mockResolvedValueOnce(makeSectionResponse())
      .mockResolvedValueOnce(makeSectionResponse({
        name: 'Chorus',
        lines: [
          { text: 'Refrain un', rhymingSyllables: 'un', rhyme: 'A', syllables: 3, concept: 'refrain' },
          { text: 'Refrain deux', rhymingSyllables: 'eux', rhyme: 'A', syllables: 3, concept: 'refrain' },
          { text: 'Refrain trois', rhymingSyllables: 'ois', rhyme: 'B', syllables: 3, concept: 'refrain' },
          { text: 'Refrain quatre', rhymingSyllables: 'atre', rhyme: 'B', syllables: 3, concept: 'refrain' },
        ],
      }))
      .mockResolvedValueOnce(makeMetadataResponse());

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
    expect(generateContentWithRetry).toHaveBeenCalledTimes(3);
    expect(vi.mocked(generateContentWithRetry).mock.calls[0]?.[0].contents).toContain('Première ligne');
    expect(vi.mocked(generateContentWithRetry).mock.calls[0]?.[0].contents).not.toContain('Refrain un');
    expect(vi.mocked(generateContentWithRetry).mock.calls[1]?.[0].contents).toContain('Refrain un');
    expect(result.current.importProgress).toEqual({ current: 0, total: 0, currentLabel: '' });
  });

  it('surfaces a language mismatch without auto-updating the current song language', async () => {
    const params = {
      ...createParams(),
      currentSongLanguage: 'English',
    };
    vi.mocked(generateContentWithRetry)
      .mockResolvedValueOnce(makeSectionResponse({ lines: [
        { text: 'Je marche encore', rhymingSyllables: 'ore', rhyme: 'A', syllables: 4, concept: 'marche' },
        { text: 'Sous la pluie', rhymingSyllables: 'uie', rhyme: 'A', syllables: 3, concept: 'pluie' },
      ] }))
      .mockResolvedValueOnce(makeMetadataResponse({ language: 'French' }));

    const { result } = renderHook(() => usePasteImport(params));

    act(() => {
      result.current.setPastedText('Je marche encore\nSous la pluie');
    });

    await act(async () => {
      await result.current.analyzePastedLyrics();
    });

    expect(params.onLanguageMismatch).toHaveBeenCalledWith('French');
    expect(generateContentWithRetry).toHaveBeenCalledTimes(2);
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

  it('reports paste availability when the clipboard contains text', async () => {
    const params = createParams();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: vi.fn().mockResolvedValue('Already copied lyrics'),
      },
    });

    const { result } = renderHook(() => usePasteImport(params));

    await waitFor(() => {
      expect(result.current.canPasteLyrics).toBe(true);
    });
  });

  it('keeps paste available when draft pasted text exists even if the clipboard is empty', async () => {
    const params = createParams();
    const { result } = renderHook(() => usePasteImport(params));

    await waitFor(() => {
      expect(result.current.canPasteLyrics).toBe(false);
    });

    act(() => {
      result.current.setPastedText('Saved draft lyrics');
    });

    expect(result.current.canPasteLyrics).toBe(true);
  });

  it('preserves existing markup-based sections without duplicating their tags as lyric lines', async () => {
    const params = createParams();
    vi.mocked(generateContentWithRetry)
      .mockResolvedValueOnce(makeSectionResponse({
        name: 'Verse',
        lines: [
          { text: 'Sous les néons on avance', rhymingSyllables: 'ance', rhyme: 'A', syllables: 6, concept: 'marche' },
          { text: 'La ville entière est immense', rhymingSyllables: 'ense', rhyme: 'A', syllables: 6, concept: 'ville' },
        ],
      }))
      .mockResolvedValueOnce(makeSectionResponse({
        name: 'Chorus',
        lines: [
          { text: 'Nos voix se répondent', rhymingSyllables: 'onde', rhyme: 'B', syllables: 5, concept: 'voix' },
          { text: 'Les ombres nous inondent', rhymingSyllables: 'onde', rhyme: 'B', syllables: 5, concept: 'ombre' },
        ],
      }))
      .mockResolvedValueOnce(makeMetadataResponse());

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
    expect(vi.mocked(generateContentWithRetry).mock.calls[0]?.[0].contents).toContain('Source section label: Couplet');
    expect(vi.mocked(generateContentWithRetry).mock.calls[1]?.[0].contents).toContain('Source section label: Refrain');
  });

  it('still imports successfully analysed sections when one chunk fails with a 504 timeout', async () => {
    const params = createParams();
    const timeoutError = new Error('Server error 504') as Error & { code?: number };
    timeoutError.code = 504;

    vi.mocked(generateContentWithRetry)
      .mockResolvedValueOnce(makeSectionResponse({ name: 'Verse 1' }))
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce(makeSectionResponse({
        name: 'Chorus',
        lines: [
          { text: 'Refrain un', rhymingSyllables: 'un', rhyme: 'A', syllables: 3, concept: 'refrain' },
        ],
      }))
      .mockResolvedValueOnce(makeMetadataResponse());

    const { result } = renderHook(() => usePasteImport(params));

    act(() => {
      result.current.setPastedText(
        'Première ligne\nDeuxième ligne\n\nBridge line one\nBridge line two\n\nRefrain un',
      );
    });

    await act(async () => {
      await result.current.analyzePastedLyrics();
    });

    expect(params.updateSongAndStructureWithHistory).toHaveBeenCalledTimes(1);
    const [song, structure] = vi.mocked(params.updateSongAndStructureWithHistory).mock.calls[0]!;
    expect(song).toHaveLength(2);
    expect(structure).toEqual(['Verse 1', 'Chorus']);
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it('reports an error when ALL section chunks fail', async () => {
    const params = createParams();
    const timeoutError = new Error('Server error 504') as Error & { code?: number };
    timeoutError.code = 504;

    vi.mocked(generateContentWithRetry)
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError);

    const { result } = renderHook(() => usePasteImport(params));

    act(() => {
      result.current.setPastedText('Ligne A\nLigne B\n\nLigne C\nLigne D');
    });

    await act(async () => {
      await result.current.analyzePastedLyrics();
    });

    expect(params.updateSongAndStructureWithHistory).not.toHaveBeenCalled();
    expect(handleApiError).toHaveBeenCalled();
  });
});

import React, { useLayoutEffect } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Section } from '../../types';
import type { LibraryAsset } from '../../utils/libraryUtils';
import { SongProvider, useSongContext } from '../../contexts/SongContext';
import { useLibrarySongActions } from '../useLibrarySongActions';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSavedAsset: LibraryAsset = {
  id: 'saved-1',
  title: 'My Song',
  timestamp: 1000,
  type: 'song',
  sections: [],
};

vi.mock('../../utils/libraryUtils', () => ({
  saveAssetToLibrary: vi.fn(async () => mockSavedAsset),
  loadLibraryAssets: vi.fn(async () => [mockSavedAsset]),
  loadAssetIntoEditor: vi.fn((asset: LibraryAsset) => ({
    song: asset.sections,
    structure: asset.sections.map((s: Section) => s.name),
    title: asset.title,
    topic: 'test-topic',
    mood: 'test-mood',
    rhymeScheme: 'ABAB',
    targetSyllables: 8,
    genre: 'pop',
    tempo: 100,
    instrumentation: 'guitar',
    rhythm: 'straight',
    narrative: 'first-person',
    musicalPrompt: 'upbeat',
  })),
}));

// ── SongProvider wrapper helpers ─────────────────────────────────────────────

const makeSection = (id: string, name: string): Section => ({
  id,
  name,
  lines: [],
});

function SongContextInitializer({
  song,
  structure,
  title,
  children,
}: {
  song: Section[];
  structure: string[];
  title?: string;
  children?: React.ReactNode;
}) {
  const { replaceStateWithoutHistory, setTitle } = useSongContext();

  useLayoutEffect(() => {
    replaceStateWithoutHistory(song, structure);
    if (title) setTitle(title);
  }, [replaceStateWithoutHistory, setTitle, song, structure, title]);

  return React.createElement(React.Fragment, null, children);
}

function buildHook(
  song: Section[],
  structure: string[],
  title = '',
  params = {
    setIsSavingToLibrary: vi.fn(),
    setIsSaveToLibraryModalOpen: vi.fn(),
    setLibraryCount: vi.fn(),
    setLibraryAssets: vi.fn(),
    setSaveError: vi.fn(),
  },
) {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      SongProvider,
      null,
      React.createElement(SongContextInitializer, { song, structure, title }, children),
    );

  const { result } = renderHook(
    () => ({
      hook: useLibrarySongActions(params),
      context: useSongContext(),
    }),
    { wrapper },
  );

  return { result, params };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useLibrarySongActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSaveToLibrary', () => {
    it('does nothing when song is empty', async () => {
      const { result, params } = buildHook([], []);

      await act(async () => {
        await result.current.hook.handleSaveToLibrary();
      });

      expect(params.setIsSavingToLibrary).not.toHaveBeenCalled();
    });

    it('sets isSavingToLibrary to true then false on success', async () => {
      const section = makeSection('s1', 'Verse 1');
      const { result, params } = buildHook([section], ['Verse 1']);

      await act(async () => {
        await result.current.hook.handleSaveToLibrary();
      });

      expect(params.setIsSavingToLibrary).toHaveBeenCalledWith(true);
      expect(params.setIsSavingToLibrary).toHaveBeenCalledWith(false);
    });

    it('updates library count and assets after save', async () => {
      const section = makeSection('s1', 'Verse 1');
      const { result, params } = buildHook([section], ['Verse 1']);

      await act(async () => {
        await result.current.hook.handleSaveToLibrary();
      });

      expect(params.setLibraryCount).toHaveBeenCalledWith(1);
      expect(params.setLibraryAssets).toHaveBeenCalledWith([mockSavedAsset]);
    });

    it('does not call setSaveError on success', async () => {
      const section = makeSection('s1', 'Verse 1');
      const { result, params } = buildHook([section], ['Verse 1']);

      await act(async () => {
        await result.current.hook.handleSaveToLibrary();
      });

      expect(params.setSaveError).not.toHaveBeenCalledWith(expect.stringContaining('Failed'));
    });

    it('guarantees setIsSavingToLibrary(false) via finally when save rejects', async () => {
      const { saveAssetToLibrary } = await import('../../utils/libraryUtils');
      vi.mocked(saveAssetToLibrary).mockRejectedValueOnce(new Error('network error'));

      const section = makeSection('s1', 'Verse 1');
      const { result, params } = buildHook([section], ['Verse 1']);

      await act(async () => {
        await result.current.hook.handleSaveToLibrary();
      });

      expect(params.setIsSavingToLibrary).toHaveBeenCalledWith(true);
      expect(params.setIsSavingToLibrary).toHaveBeenLastCalledWith(false);
      expect(params.setLibraryCount).not.toHaveBeenCalled();
      expect(params.setLibraryAssets).not.toHaveBeenCalled();
    });

    it('calls setSaveError with a message when save rejects', async () => {
      const { saveAssetToLibrary } = await import('../../utils/libraryUtils');
      vi.mocked(saveAssetToLibrary).mockRejectedValueOnce(new Error('network error'));

      const section = makeSection('s1', 'Verse 1');
      const { result, params } = buildHook([section], ['Verse 1']);

      await act(async () => {
        await result.current.hook.handleSaveToLibrary();
      });

      expect(params.setSaveError).toHaveBeenCalledWith(expect.stringContaining('Failed'));
    });
  });

  describe('handleLoadLibraryAsset', () => {
    const assetToLoad: LibraryAsset = {
      id: 'asset-1',
      title: 'Loaded Song',
      timestamp: 2000,
      type: 'song',
      sections: [makeSection('sec1', 'Chorus')],
      metadata: { topic: 'test-topic', mood: 'test-mood' },
    };

    it('closes the save-to-library modal after load', () => {
      const { result, params } = buildHook([], []);

      act(() => {
        result.current.hook.handleLoadLibraryAsset(assetToLoad);
      });

      expect(params.setIsSaveToLibraryModalOpen).toHaveBeenCalledWith(false);
    });

    it('updates song context with loaded asset data', () => {
      const { result } = buildHook([], []);

      act(() => {
        result.current.hook.handleLoadLibraryAsset(assetToLoad);
      });

      expect(result.current.context.song).toEqual(assetToLoad.sections);
      expect(result.current.context.title).toBe('Loaded Song');
    });

    it('updates song meta fields in context', () => {
      const { result } = buildHook([], []);

      act(() => {
        result.current.hook.handleLoadLibraryAsset(assetToLoad);
      });

      expect(result.current.context.topic).toBe('test-topic');
      expect(result.current.context.mood).toBe('test-mood');
      expect(result.current.context.rhymeScheme).toBe('ABAB');
      expect(result.current.context.genre).toBe('pop');
    });

    it('handles legacy asset without metadata without throwing', async () => {
      const { loadAssetIntoEditor } = await import('../../utils/libraryUtils');
      vi.mocked(loadAssetIntoEditor).mockReturnValueOnce({
        song: [],
        structure: [],
        title: 'Legacy',
        topic: undefined,
        mood: undefined,
        rhymeScheme: undefined,
        targetSyllables: undefined,
        genre: undefined,
        tempo: undefined,
        instrumentation: undefined,
        rhythm: undefined,
        narrative: undefined,
        musicalPrompt: undefined,
      });

      const legacyAsset: LibraryAsset = {
        id: 'legacy-1',
        title: 'Legacy',
        timestamp: 0,
        type: 'song',
        sections: [],
      };

      const { result } = buildHook([], []);

      expect(() =>
        act(() => {
          result.current.hook.handleLoadLibraryAsset(legacyAsset);
        }),
      ).not.toThrow();
    });
  });
});

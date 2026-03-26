import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SongHistoryProvider, useSongHistoryContext } from '../SongHistoryContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SongHistoryProvider>{children}</SongHistoryProvider>
);

describe('SongHistoryContext', () => {
  describe('useSongHistoryContext', () => {
    it('throws when used outside SongHistoryProvider', () => {
      const originalError = console.error;
      console.error = () => {};
      expect(() => renderHook(() => useSongHistoryContext())).toThrow(
        'useSongHistoryContext must be used inside <SongHistoryProvider>',
      );
      console.error = originalError;
    });

    it('provides initial song and structure', () => {
      const { result } = renderHook(() => useSongHistoryContext(), { wrapper });
      expect(Array.isArray(result.current.song)).toBe(true);
      expect(Array.isArray(result.current.structure)).toBe(true);
      expect(Array.isArray(result.current.past)).toBe(true);
      expect(Array.isArray(result.current.future)).toBe(true);
    });

    it('exposes undo/redo functions', () => {
      const { result } = renderHook(() => useSongHistoryContext(), { wrapper });
      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
    });

    it('exposes updateState function', () => {
      const { result } = renderHook(() => useSongHistoryContext(), { wrapper });
      expect(typeof result.current.updateState).toBe('function');
    });

    it('exposes replaceStateWithoutHistory and clearHistory', () => {
      const { result } = renderHook(() => useSongHistoryContext(), { wrapper });
      expect(typeof result.current.replaceStateWithoutHistory).toBe('function');
      expect(typeof result.current.clearHistory).toBe('function');
    });

    it('tracks history when updateSongWithHistory is called', () => {
      const { result } = renderHook(() => useSongHistoryContext(), { wrapper });
      const newSong = [{ id: 'sec1', name: 'Verse', lines: [] }];

      act(() => {
        result.current.updateSongWithHistory(newSong);
      });

      expect(result.current.song).toEqual(newSong);
      expect(result.current.past.length).toBeGreaterThan(0);
    });

    it('undoes a song update', () => {
      const { result } = renderHook(() => useSongHistoryContext(), { wrapper });
      const originalSong = result.current.song;
      const newSong = [{ id: 'sec1', name: 'Verse', lines: [] }];

      act(() => {
        result.current.updateSongWithHistory(newSong);
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.song).toEqual(originalSong);
    });
  });
});

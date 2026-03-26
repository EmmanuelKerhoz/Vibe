import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_RHYME_SCHEME, DEFAULT_STRUCTURE } from '../constants/editor';
import { useSongHistoryState } from '../hooks/useSongHistoryState';
import { createEmptySong } from '../utils/songDefaults';

type SongHistoryContextValue = ReturnType<typeof useSongHistoryState>;

const SongHistoryContext = createContext<SongHistoryContextValue | null>(null);

export function SongHistoryProvider({ children }: { children: ReactNode }) {
  const historyState = useSongHistoryState(
    createEmptySong(DEFAULT_STRUCTURE, DEFAULT_RHYME_SCHEME),
    DEFAULT_STRUCTURE,
  );

  // Stable useCallback refs are included to satisfy react-hooks/exhaustive-deps.
  const value = useMemo<SongHistoryContextValue>(
    () => ({
      song: historyState.song,
      structure: historyState.structure,
      past: historyState.past,
      future: historyState.future,
      updateState: historyState.updateState,
      updateSongWithHistory: historyState.updateSongWithHistory,
      updateStructureWithHistory: historyState.updateStructureWithHistory,
      updateSongAndStructureWithHistory: historyState.updateSongAndStructureWithHistory,
      replaceStateWithoutHistory: historyState.replaceStateWithoutHistory,
      clearHistory: historyState.clearHistory,
      undo: historyState.undo,
      redo: historyState.redo,
    }),
    [
      historyState.song, historyState.structure, historyState.past, historyState.future,
      historyState.updateState, historyState.updateSongWithHistory,
      historyState.updateStructureWithHistory, historyState.updateSongAndStructureWithHistory,
      historyState.replaceStateWithoutHistory, historyState.clearHistory,
      historyState.undo, historyState.redo,
    ],
  );

  return (
    <SongHistoryContext.Provider value={value}>
      {children}
    </SongHistoryContext.Provider>
  );
}

export function useSongHistoryContext(): SongHistoryContextValue {
  const context = useContext(SongHistoryContext);
  if (!context) throw new Error('useSongHistoryContext must be used inside <SongHistoryProvider>');
  return context;
}

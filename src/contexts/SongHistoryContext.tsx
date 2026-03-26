import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_RHYME_SCHEME, DEFAULT_STRUCTURE } from '../constants/editor';
import { useSongHistoryState } from '../hooks/useSongHistoryState';
import { createEmptySong } from '../utils/songDefaults';

export type SongHistoryContextValue = ReturnType<typeof useSongHistoryState>;

const SongHistoryContext = createContext<SongHistoryContextValue | null>(null);

export function SongHistoryProvider({ children }: { children: ReactNode }) {
  const history = useSongHistoryState(
    createEmptySong(DEFAULT_STRUCTURE, DEFAULT_RHYME_SCHEME),
    DEFAULT_STRUCTURE,
  );

  const value = useMemo(() => history, [history]);

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

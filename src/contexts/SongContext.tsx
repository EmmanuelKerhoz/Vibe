import React, { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_RHYME_SCHEME, DEFAULT_STRUCTURE } from '../constants/editor';
import { useSongHistoryState } from '../hooks/useSongHistoryState';
import { useSongMeta } from '../hooks/useSongMeta';
import { createEmptySong } from '../utils/songDefaults';

type SongContextValue = ReturnType<typeof useSongHistoryState> & ReturnType<typeof useSongMeta>;

const SongContext = createContext<SongContextValue | null>(null);

export function SongProvider({ children }: { children: ReactNode }) {
  const history = useSongHistoryState(
    createEmptySong(DEFAULT_STRUCTURE, DEFAULT_RHYME_SCHEME),
    DEFAULT_STRUCTURE,
  );
  const meta = useSongMeta();

  return (
    <SongContext.Provider value={{ ...history, ...meta }}>
      {children}
    </SongContext.Provider>
  );
}

export function useSongContext(): SongContextValue {
  const context = useContext(SongContext);
  if (!context) throw new Error('useSongContext must be used inside <SongProvider>');
  return context;
}

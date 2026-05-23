/**
 * LibraryContext
 *
 * Lifts useLibrary() to a shared React context so that both
 * VoxNovaPlayer and LyriaFullSongPanel (and any future consumer)
 * operate on the same tracks[] instance.
 */
import React, { createContext, useContext, type ReactNode } from 'react';
import { useLibrary, type LibraryState } from '../features/player/useLibrary';

const LibraryContext = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const library = useLibrary();
  return (
    <LibraryContext.Provider value={library}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibraryContext(): LibraryState {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibraryContext must be used inside <LibraryProvider>');
  return ctx;
}

export function useOptionalLibraryContext(): LibraryState | null {
  return useContext(LibraryContext);
}

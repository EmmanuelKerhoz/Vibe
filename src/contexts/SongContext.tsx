import React from 'react';
import { SongHistoryProvider, useSongHistoryContext } from './SongHistoryContext';
import { SongMetaProvider, useSongMetaContext } from './SongMetaContext';

export { SongHistoryProvider } from './SongHistoryContext';
export { SongMetaProvider } from './SongMetaContext';

export function SongProvider({ children }: { children: React.ReactNode }) {
  return (
    <SongHistoryProvider>
      <SongMetaProvider>
        {children}
      </SongMetaProvider>
    </SongHistoryProvider>
  );
}

export function useSongContext() {
  return {
    ...useSongHistoryContext(),
    ...useSongMetaContext(),
  };
}

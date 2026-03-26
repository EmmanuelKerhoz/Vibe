import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSongMeta } from '../hooks/useSongMeta';

export type SongMetaContextValue = ReturnType<typeof useSongMeta>;

const SongMetaContext = createContext<SongMetaContextValue | null>(null);

export function SongMetaProvider({ children }: { children: ReactNode }) {
  const meta = useSongMeta();

  const value = useMemo(() => meta, [meta]);

  return (
    <SongMetaContext.Provider value={value}>
      {children}
    </SongMetaContext.Provider>
  );
}

export function useSongMetaContext(): SongMetaContextValue {
  const context = useContext(SongMetaContext);
  if (!context) throw new Error('useSongMetaContext must be used inside <SongMetaProvider>');
  return context;
}

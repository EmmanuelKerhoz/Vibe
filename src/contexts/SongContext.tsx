import React, { useMemo, type ReactNode } from 'react';
import {
  SongHistoryProvider,
  useSongHistoryContext,
  type SongHistoryContextValue,
} from './SongHistoryContext';
import {
  SongMetaProvider,
  useSongMetaContext,
  type SongMetaContextValue,
} from './SongMetaContext';

type SongContextValue = SongHistoryContextValue & SongMetaContextValue;

export function SongProvider({ children }: { children: ReactNode }) {
  return (
    <SongHistoryProvider>
      <SongMetaProvider>{children}</SongMetaProvider>
    </SongHistoryProvider>
  );
}

export function useSongContext(): SongContextValue {
  const history = useSongHistoryContext();
  const meta = useSongMetaContext();

  return useMemo(() => ({ ...history, ...meta }), [history, meta]);
}

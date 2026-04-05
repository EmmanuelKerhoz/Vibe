import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_RHYME_SCHEME, DEFAULT_STRUCTURE } from '../constants/editor';
import { useSongHistoryState } from '../hooks/useSongHistoryState';
import { useSongMeta } from '../hooks/useSongMeta';
import { createEmptySong } from '../utils/songDefaults';
import type { Section } from '../types';

// ─── SongHistoryContext ───────────────────────────────────────────────────────
// Carries only the undo/redo stack — stable references that change at most once
// per user undo/redo action, never on every keystroke.
// Consumers: TopRibbon (undo/redo buttons) and VersionContext.

type SongHistorySnapshot = { song: Section[]; structure: string[] };

export type SongHistoryContextValue = {
  past: SongHistorySnapshot[];
  future: SongHistorySnapshot[];
  undo: () => void;
  redo: () => void;
};

const SongHistoryContext = createContext<SongHistoryContextValue | null>(null);

export function useSongHistoryContext(): SongHistoryContextValue {
  const ctx = useContext(SongHistoryContext);
  if (!ctx) throw new Error('useSongHistoryContext must be used inside <SongProvider>');
  return ctx;
}

// ─── SongContext ──────────────────────────────────────────────────────────────
// Full song state: song + structure + meta + all mutation helpers.
// Unchanged public surface — all existing useSongContext() calls need no update.

type SongContextValue = ReturnType<typeof useSongHistoryState> & ReturnType<typeof useSongMeta>;

const SongContext = createContext<SongContextValue | null>(null);

export function useSongContext(): SongContextValue {
  const context = useContext(SongContext);
  if (!context) throw new Error('useSongContext must be used inside <SongProvider>');
  return context;
}

// ─── SongProvider ─────────────────────────────────────────────────────────────
// Nests SongHistoryContext inside SongContext so both are provided in one mount.

export function SongProvider({ children }: { children: ReactNode }) {
  const history = useSongHistoryState(
    createEmptySong(DEFAULT_STRUCTURE, DEFAULT_RHYME_SCHEME),
    DEFAULT_STRUCTURE,
  );
  const meta = useSongMeta();

  // SongHistoryContext value — only changes on undo/redo, never on keystroke.
  const historyValue = useMemo<SongHistoryContextValue>(
    () => ({
      past: history.past,
      future: history.future,
      undo: history.undo,
      redo: history.redo,
    }),
    // history.past and history.future are new array references only when
    // applySnapshot/undo/redo fires — not on every song mutation.
    [history.past, history.future, history.undo, history.redo],
  );

  // SongContext value — depends on primitive state slices and stable callbacks,
  // NOT on the `history` object reference (which is reconstructed every render).
  // This prevents the memo from invalidating on every SongProvider render and
  // cascading re-renders to all useSongContext() consumers.
  const value = useMemo<SongContextValue>(
    () => ({ ...history, ...meta }),
    [
      // State slices — change only when song data mutates
      history.song,
      history.structure,
      history.past,
      history.future,
      // Callbacks — all useCallback([], []) or useCallback([stable], [stable]),
      // referentially stable across renders
      history.updateState,
      history.updateSongWithHistory,
      history.updateStructureWithHistory,
      history.updateSongAndStructureWithHistory,
      history.replaceStateWithoutHistory,
      history.clearHistory,
      history.undo,
      history.redo,
      // Meta — stable ref from useSongMeta
      meta,
    ],
  );

  return (
    <SongHistoryContext.Provider value={historyValue}>
      <SongContext.Provider value={value}>
        {children}
      </SongContext.Provider>
    </SongHistoryContext.Provider>
  );
}

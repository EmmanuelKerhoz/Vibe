import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_RHYME_SCHEME, DEFAULT_STRUCTURE } from '../constants/editor';
import { useSongHistoryState } from '../hooks/useSongHistoryState';
import { useSongMeta } from '../hooks/useSongMeta';
import { createEmptySong } from '../utils/songDefaults';
import type { Section } from '../types';
import type { SessionSnapshot } from '../lib/sessionPersistence';

// ─── SongHistoryContext ───────────────────────────────────────────────────────

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

type SongContextValue = ReturnType<typeof useSongHistoryState> & ReturnType<typeof useSongMeta>;

const SongContext = createContext<SongContextValue | null>(null);

export function useSongContext(): SongContextValue {
  const context = useContext(SongContext);
  if (!context) throw new Error('useSongContext must be used inside <SongProvider>');
  return context;
}

// ─── SongProvider ─────────────────────────────────────────────────────────────

interface SongProviderProps {
  children: ReactNode;
  /** Optional session snapshot loaded from OPFS before first render. */
  initialSession?: SessionSnapshot | null;
}

export function SongProvider({ children, initialSession }: SongProviderProps) {
  const initialSong = initialSession?.song ?? createEmptySong(DEFAULT_STRUCTURE, DEFAULT_RHYME_SCHEME);
  const initialStructure = initialSession?.structure ?? DEFAULT_STRUCTURE;

  const meta = useSongMeta(initialSession ?? undefined);

  const metaSetters = useMemo(() => ({
    setTitle: meta.setTitle,
    setTitleOrigin: meta.setTitleOrigin,
    setTopic: meta.setTopic,
    setMood: meta.setMood,
    setRhymeScheme: meta.setRhymeScheme,
    setTargetSyllables: meta.setTargetSyllables,
    setGenre: meta.setGenre,
    setTempo: meta.setTempo,
    setInstrumentation: meta.setInstrumentation,
    setRhythm: meta.setRhythm,
    setNarrative: meta.setNarrative,
    setMusicalPrompt: meta.setMusicalPrompt,
  }), [
    meta.setTitle, meta.setTitleOrigin, meta.setTopic, meta.setMood,
    meta.setRhymeScheme, meta.setTargetSyllables, meta.setGenre, meta.setTempo,
    meta.setInstrumentation, meta.setRhythm, meta.setNarrative, meta.setMusicalPrompt,
  ]);

  const history = useSongHistoryState(initialSong, initialStructure, metaSetters);

  const historyValue = useMemo<SongHistoryContextValue>(
    () => ({
      past: history.past,
      future: history.future,
      undo: history.undo,
      redo: history.redo,
    }),
    [history.past, history.future, history.undo, history.redo],
  );

  const value = useMemo<SongContextValue>(
    () => ({ ...history, ...meta }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      history.song,
      history.structure,
      history.past,
      history.future,
      history.updateState,
      history.updateSongWithHistory,
      history.updateStructureWithHistory,
      history.updateSongAndStructureWithHistory,
      history.navigateWithHistory,
      history.replaceStateWithoutHistory,
      history.clearHistory,
      history.undo,
      history.redo,
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

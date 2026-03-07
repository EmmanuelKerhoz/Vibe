import { useCallback, useState } from 'react';
import type { Section } from '../types';
import { cleanSectionName } from '../utils/songUtils';

type SongHistorySnapshot = {
  song: Section[];
  structure: string[];
};

type SongHistoryState = SongHistorySnapshot & {
  past: SongHistorySnapshot[];
  future: SongHistorySnapshot[];
};

const cleanSong = (song: Section[]): Section[] => song.map(section => ({ ...section, name: cleanSectionName(section.name) }));
const cleanStructure = (structure: string[]): string[] => structure.map(name => cleanSectionName(name));

const normalizeSnapshot = (snapshot: SongHistorySnapshot): SongHistorySnapshot => ({
  song: cleanSong(snapshot.song),
  structure: cleanStructure(snapshot.structure),
});

export const useSongHistoryState = (initialSong: Section[] = [], initialStructure: string[] = []) => {
  const [state, setState] = useState<SongHistoryState>(() => ({
    ...normalizeSnapshot({ song: initialSong, structure: initialStructure }),
    past: [],
    future: [],
  }));

  const applySnapshot = useCallback((nextSnapshot: SongHistorySnapshot, options?: { trackHistory?: boolean }) => {
    const normalizedNext = normalizeSnapshot(nextSnapshot);

    setState(current => ({
      song: normalizedNext.song,
      structure: normalizedNext.structure,
      past: options?.trackHistory === false ? current.past : [...current.past, { song: current.song, structure: current.structure }],
      future: options?.trackHistory === false ? current.future : [],
    }));
  }, []);

  const updateState = useCallback((recipe: (current: SongHistorySnapshot) => SongHistorySnapshot) => {
    setState(current => {
      const nextSnapshot = normalizeSnapshot(recipe({ song: current.song, structure: current.structure }));
      return {
        song: nextSnapshot.song,
        structure: nextSnapshot.structure,
        past: [...current.past, { song: current.song, structure: current.structure }],
        future: [],
      };
    });
  }, []);

  const updateSongWithHistory = useCallback((newSong: Section[]) => {
    updateState(current => ({ song: newSong, structure: current.structure }));
  }, [updateState]);

  const updateStructureWithHistory = useCallback((newStructure: string[]) => {
    updateState(current => ({ song: current.song, structure: newStructure }));
  }, [updateState]);

  const updateSongAndStructureWithHistory = useCallback((newSong: Section[], newStructure: string[]) => {
    updateState(() => ({ song: newSong, structure: newStructure }));
  }, [updateState]);

  const replaceStateWithoutHistory = useCallback((newSong: Section[], newStructure: string[]) => {
    applySnapshot({ song: newSong, structure: newStructure }, { trackHistory: false });
  }, [applySnapshot]);

  const clearHistory = useCallback(() => {
    setState(current => ({ ...current, past: [], future: [] }));
  }, []);

  const undo = useCallback(() => {
    setState(current => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      return {
        song: previous.song,
        structure: previous.structure,
        past: current.past.slice(0, -1),
        future: [{ song: current.song, structure: current.structure }, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(current => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      return {
        song: next.song,
        structure: next.structure,
        past: [...current.past, { song: current.song, structure: current.structure }],
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    song: state.song,
    structure: state.structure,
    past: state.past,
    future: state.future,
    updateState,
    applySnapshot,
    updateSongWithHistory,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
    replaceStateWithoutHistory,
    clearHistory,
    undo,
    redo,
  };
};

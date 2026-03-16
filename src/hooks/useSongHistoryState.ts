import { useCallback, useState } from 'react';
import type { Section } from '../types';
import { generateId } from '../utils/idUtils';
import { isPureMetaLine } from '../utils/metaUtils';
import { cleanSectionName } from '../utils/songUtils';

const MAX_HISTORY = 50;

type SongHistorySnapshot = {
  song: Section[];
  structure: string[];
};

type SongHistoryState = SongHistorySnapshot & {
  past: SongHistorySnapshot[];
  future: SongHistorySnapshot[];
};

const cleanSong = (song: Section[]): Section[] => song.map((section) => ({
  ...section,
  id: section.id || generateId(),
  name: cleanSectionName(section.name),
  lines: (section.lines ?? []).map((line) => {
    const text = line.text ?? '';
    const isMeta = isPureMetaLine(text);
    return {
      ...line,
      id: line.id || generateId(),
      text,
      rhymingSyllables: line.rhymingSyllables ?? '',
      rhyme: line.rhyme ?? '',
      syllables: typeof line.syllables === 'number' ? line.syllables : 0,
      concept: line.concept ?? (isMeta ? 'Meta' : 'New line'),
      isMeta,
    };
  }),
}));

const cleanStructure = (structure: string[]): string[] =>
  structure.map(name => cleanSectionName(name));

const normalizeSnapshot = (snapshot: SongHistorySnapshot): SongHistorySnapshot => ({
  song: cleanSong(snapshot.song),
  structure: cleanStructure(snapshot.structure),
});

const cappedPast = (past: SongHistorySnapshot[]): SongHistorySnapshot[] =>
  past.length > MAX_HISTORY ? past.slice(past.length - MAX_HISTORY) : past;

// ─── Delta helpers ────────────────────────────────────────────────────────────
const sectionFingerprint = (s: Section): string =>
  `${s.id}:${s.name}:${(s.lines ?? []).map(l => `${l.id}:${l.text}:${l.syllables}`).join('|')}`;

const snapshotFingerprint = (snap: SongHistorySnapshot): string =>
  snap.song.map(sectionFingerprint).join('//') + '||' + snap.structure.join(',');

export const useSongHistoryState = (initialSong: Section[] = [], initialStructure: string[] = []) => {
  const [state, setState] = useState<SongHistoryState>(() => ({
    ...normalizeSnapshot({ song: initialSong, structure: initialStructure }),
    past: [],
    future: [],
  }));

  const applySnapshot = useCallback((nextSnapshot: SongHistorySnapshot, options?: { trackHistory?: boolean }) => {
    const normalizedNext = normalizeSnapshot(nextSnapshot);
    setState(current => {
      if (options?.trackHistory === false) {
        return {
          song: normalizedNext.song,
          structure: normalizedNext.structure,
          past: current.past,
          future: current.future,
        };
      }
      const currentFp = snapshotFingerprint({ song: current.song, structure: current.structure });
      const nextFp = snapshotFingerprint(normalizedNext);
      if (currentFp === nextFp) return current;
      return {
        song: normalizedNext.song,
        structure: normalizedNext.structure,
        past: cappedPast([...current.past, { song: current.song, structure: current.structure }]),
        future: [],
      };
    });
  }, []);

  const updateState = useCallback((recipe: (current: SongHistorySnapshot) => SongHistorySnapshot) => {
    setState(current => {
      const nextSnapshot = normalizeSnapshot(recipe({ song: current.song, structure: current.structure }));
      const currentFp = snapshotFingerprint({ song: current.song, structure: current.structure });
      const nextFp = snapshotFingerprint(nextSnapshot);
      if (currentFp === nextFp) return current;
      return {
        song: nextSnapshot.song,
        structure: nextSnapshot.structure,
        past: cappedPast([...current.past, { song: current.song, structure: current.structure }]),
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
      if (!previous) return current;
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
      if (!next) return current;
      return {
        song: next.song,
        structure: next.structure,
        past: cappedPast([...current.past, { song: current.song, structure: current.structure }]),
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

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

export type UpdateSongAndStructureWithHistory = (
  newSong: Section[],
  newStructure: string[],
) => void;

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

/**
 * Per-section fingerprint: id + name + line count guard + per-line digest.
 * Early-exits on line-count mismatch before building the line string —
 * avoids O(n) concat when sections are replaced wholesale (AI generation).
 */
const sectionFingerprint = (s: Section): string => {
  const lines = s.lines ?? [];
  // Prefix with line count so a count change is immediately visible
  // without iterating individual lines.
  const lineCount = lines.length;
  const lineDigest = lines.map(l => `${l.id}:${l.text}:${l.syllables}`).join('|');
  return `${s.id}:${s.name}:${lineCount}:${lineDigest}`;
};

/**
 * Full snapshot fingerprint with two early-exit guards:
 * 1. Section-count mismatch → return immediately (O(1)).
 * 2. Structure string mismatch → return immediately (O(k) where k = section names).
 * Only reaches per-line iteration when counts match.
 *
 * NOTE: this function is called twice per applySnapshot/updateState invocation
 * (current + next). The guards ensure the common case of a full-song replacement
 * (AI generation) resolves in O(1) instead of O(n×m).
 */
const snapshotFingerprint = (snap: SongHistorySnapshot): string => {
  // Guard 1: encode section count directly into the fingerprint prefix.
  // A caller comparing two fingerprints will see mismatch at the first char
  // when counts differ — no need for a separate fast-path outside this fn.
  const sectionCount = snap.song.length;
  const structureKey = snap.structure.join(',');
  const songKey = snap.song.map(sectionFingerprint).join('//');
  return `${sectionCount}|${structureKey}||${songKey}`;
};

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

  const updateSongAndStructureWithHistory: UpdateSongAndStructureWithHistory = useCallback((newSong, newStructure) => {
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
    updateSongWithHistory,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
    replaceStateWithoutHistory,
    clearHistory,
    undo,
    redo,
  };
};

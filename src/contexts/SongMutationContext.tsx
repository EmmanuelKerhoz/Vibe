import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useSongContext } from './SongContext';
import { generateId } from '../utils/idUtils';
import { isLinkedChorusSectionName, isLinkedPreChorusPair, isPreChorusSectionName } from '../constants/sections';
import type { Section } from '../types';

// Module-level helpers for tied section detection
const isSectionPreChorus = (s: Section) => isPreChorusSectionName(s.name);
const isSectionChorus = (s: Section) => isLinkedChorusSectionName(s.name);

// Strip trailing number: "VERSE 2" → "VERSE", "CHORUS" → "CHORUS"
function baseTypeName(name: string): string {
  return name.replace(/\s+\d+$/, '').trim();
}

interface SongMutationContextValue {
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  moveLineUp: (sectionId: string, lineId: string) => void;
  moveLineDown: (sectionId: string, lineId: string) => void;
  addLineToSection: (sectionId: string, afterLineId?: string) => void;
  deleteLineFromSection: (sectionId: string, lineId: string) => void;
  setSectionName: (sectionId: string, name: string) => void;
  renameSectionWithRenumber: (sectionId: string, newName: string) => void;
  setSectionRhymeScheme: (sectionId: string, scheme: string) => void;
}

const SongMutationContext = createContext<SongMutationContextValue | null>(null);

export function SongMutationProvider({ children }: { children: ReactNode }) {
  const { song, updateState, updateSongAndStructureWithHistory } = useSongContext();

  const moveSectionUp = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx <= 0) return;

    let blockStart = idx;
    let blockEnd = idx;
    const section = song[idx]!;
    if (idx + 1 < song.length && isLinkedPreChorusPair(section.name, song[idx + 1]!.name)) {
      blockEnd = idx + 1;
    } else if (isSectionChorus(section) && idx > 0 && isSectionPreChorus(song[idx - 1]!)) {
      blockStart = idx - 1;
    }

    if (blockStart === 0) return;
    const newSong = [...song];
    const block = newSong.splice(blockStart, blockEnd - blockStart + 1);
    newSong.splice(blockStart - 1, 0, ...block);
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const moveSectionDown = useCallback((sectionId: string) => {
    const idx = song.findIndex(s => s.id === sectionId);
    if (idx < 0 || idx >= song.length - 1) return;

    let blockStart = idx;
    let blockEnd = idx;
    const section = song[idx]!;
    if (idx + 1 < song.length && isLinkedPreChorusPair(section.name, song[idx + 1]!.name)) {
      blockEnd = idx + 1;
    } else if (isSectionChorus(section) && idx > 0 && isSectionPreChorus(song[idx - 1]!)) {
      blockStart = idx - 1;
      blockEnd = idx;
    }

    if (blockEnd >= song.length - 1) return;
    const newSong = [...song];
    const block = newSong.splice(blockStart, blockEnd - blockStart + 1);
    newSong.splice(blockStart + 1, 0, ...block);
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const moveLineUp = useCallback((sectionId: string, lineId: string) => {
    updateState(current => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.lines.findIndex(l => l.id === lineId);
        if (idx <= 0) return s;
        const lines = [...s.lines];
        [lines[idx - 1], lines[idx]] = [lines[idx]!, lines[idx - 1]!];
        return { ...s, lines };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const moveLineDown = useCallback((sectionId: string, lineId: string) => {
    updateState(current => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        const idx = s.lines.findIndex(l => l.id === lineId);
        if (idx < 0 || idx >= s.lines.length - 1) return s;
        const lines = [...s.lines];
        [lines[idx], lines[idx + 1]] = [lines[idx + 1]!, lines[idx]!];
        return { ...s, lines };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const addLineToSection = useCallback((sectionId: string, afterLineId?: string) => {
    const newLine = { id: generateId(), text: '', rhymingSyllables: '', rhyme: '', syllables: 0, concept: '', isManual: true };
    updateState(current => ({
      song: current.song.map(s => {
        if (s.id !== sectionId) return s;
        if (!afterLineId) {
          return { ...s, lines: [...s.lines, newLine] };
        }
        const afterIdx = s.lines.findIndex(l => l.id === afterLineId);
        if (afterIdx === -1) {
          return { ...s, lines: [...s.lines, newLine] };
        }
        const lines = [...s.lines];
        lines.splice(afterIdx + 1, 0, newLine);
        return { ...s, lines };
      }),
      structure: current.structure,
    }));
  }, [updateState]);

  const deleteLineFromSection = useCallback((sectionId: string, lineId: string) => {
    updateState(current => ({
      song: current.song.map(s =>
        s.id !== sectionId ? s : { ...s, lines: s.lines.filter(l => l.id !== lineId) }
      ),
      structure: current.structure,
    }));
  }, [updateState]);

  const setSectionName = useCallback((sectionId: string, newName: string) => {
    const newSong = song.map(s => s.id === sectionId ? { ...s, name: newName } : s);
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  /**
   * Rename section sectionId to newName, then re-number all sections whose
   * base type matches newName's base type (in song order, 1-indexed if > 1).
   * E.g. renaming INTRO → VERSE when two VERSEs already exist:
   *   existing VERSE 1 stays "VERSE 1", existing VERSE 2 stays "VERSE 2",
   *   renamed section becomes "VERSE 3" (last in song order).
   * If only one section of the type exists after renaming, no number is appended.
   */
  const renameSectionWithRenumber = useCallback((sectionId: string, newName: string) => {
    const targetBase = baseTypeName(newName);
    // First pass: rename the target section
    const renamed = song.map(s => s.id === sectionId ? { ...s, name: newName } : s);
    // Second pass: collect all sections whose base matches targetBase
    const matchingIds = renamed
      .filter(s => baseTypeName(s.name) === targetBase)
      .map(s => s.id);
    if (matchingIds.length <= 1) {
      // Single occurrence — use bare name (strip any stale number)
      const newSong = renamed.map(s =>
        s.id === sectionId ? { ...s, name: targetBase } : s
      );
      updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
      return;
    }
    // Multiple occurrences — number them in song-order starting at 1
    let counter = 1;
    const newSong = renamed.map(s => {
      if (baseTypeName(s.name) !== targetBase) return s;
      return { ...s, name: `${targetBase} ${counter++}` };
    });
    updateSongAndStructureWithHistory(newSong, newSong.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  const setSectionRhymeScheme = useCallback((sectionId: string, newScheme: string) => {
    updateState(current => ({
      song: current.song.map(s => s.id === sectionId ? { ...s, rhymeScheme: newScheme } : s),
      structure: current.structure,
    }));
  }, [updateState]);

  const value = useMemo<SongMutationContextValue>(() => ({
    moveSectionUp, moveSectionDown,
    moveLineUp, moveLineDown,
    addLineToSection, deleteLineFromSection,
    setSectionName, renameSectionWithRenumber,
    setSectionRhymeScheme,
  }), [
    moveSectionUp, moveSectionDown,
    moveLineUp, moveLineDown,
    addLineToSection, deleteLineFromSection,
    setSectionName, renameSectionWithRenumber,
    setSectionRhymeScheme,
  ]);

  return (
    <SongMutationContext.Provider value={value}>
      {children}
    </SongMutationContext.Provider>
  );
}

export function useSongMutation(): SongMutationContextValue {
  const context = useContext(SongMutationContext);
  if (!context) throw new Error('useSongMutation must be used inside <SongMutationProvider>');
  return context;
}

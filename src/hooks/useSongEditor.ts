import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';
import type { Section } from '../types';
import { isAnchoredEndSection, isAnchoredStartSection } from '../constants/sections';
import { useDragHandlers } from './useDragHandlers';
import { useFileOperations } from './useFileOperations';
import { useSectionManager } from './useSectionManager';

type UseSongEditorParams = {
  song: Section[];
  structure: string[];
  newSectionName: string;
  setNewSectionName: Dispatch<SetStateAction<string>>;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateStructureWithHistory: (newStructure: string[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  title: string;
  topic: string;
  mood: string;
  songLanguage: string;
  openPasteModalWithText: (text: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
};

export const useSongEditor = ({
  song,
  structure,
  newSectionName,
  setNewSectionName,
  updateState,
  updateStructureWithHistory,
  updateSongAndStructureWithHistory,
  title,
  topic,
  mood,
  songLanguage,
  openPasteModalWithText,
  playAudioFeedback,
}: UseSongEditorParams) => {
  const { removeStructureItem, addStructureItem, normalizeStructure } = useSectionManager({
    song,
    structure,
    newSectionName,
    setNewSectionName,
    updateState,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
  });
  const { handleDrop, handleLineDragStart, handleLineDrop } = useDragHandlers({
    song,
    structure,
    updateState,
    updateSongAndStructureWithHistory,
    playAudioFeedback,
  });
  const { exportSong, loadFileForAnalysis } = useFileOperations({
    song,
    title,
    topic,
    mood,
    songLanguage,
    openPasteModalWithText,
  });

  const introOutroSortedRef = useRef<string | null>(null);
  useEffect(() => {
    if (song.length === 0) return;
    const introIdx = song.findIndex(s => isAnchoredStartSection(s.name));
    const outroIdx = song.findIndex(s => isAnchoredEndSection(s.name));
    if (introIdx <= 0 && (outroIdx === -1 || outroIdx === song.length - 1)) return;
    const others = song.filter(s => !isAnchoredStartSection(s.name) && !isAnchoredEndSection(s.name));
    const sorted = [...(introIdx !== -1 ? [song[introIdx]!] : []), ...others, ...(outroIdx !== -1 ? [song[outroIdx]!] : [])];
    const key = JSON.stringify(sorted.map(s => s.id));
    if (key === introOutroSortedRef.current) return;
    introOutroSortedRef.current = key;
    updateSongAndStructureWithHistory(sorted, sorted.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

  return {
    removeStructureItem,
    addStructureItem,
    normalizeStructure,
    handleDrop,
    handleLineDragStart,
    handleLineDrop,
    exportSong,
    loadFileForAnalysis,
  };
};

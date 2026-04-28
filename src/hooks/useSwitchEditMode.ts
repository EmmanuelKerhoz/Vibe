/**
 * useSwitchEditMode
 * Atomic hook — mode switching only, no song→markup sync effect.
 * Use this when you need switchEditMode without the full useMarkupEditor overhead.
 */
import { useCallback } from 'react';
import { serializeSongToMarkup, parseMarkupToSections } from '../utils/markupParser';
import { useSongContext } from '../contexts/SongContext';
import type { EditMode, Section } from '../types';

interface UseSwitchEditModeParams {
  editMode: EditMode;
  markupText: string;
  setEditMode: (v: EditMode) => void;
  setMarkupText: (v: string) => void;
  updateSongAndStructureWithHistory: (song: Section[], structure: string[]) => void;
}

export function useSwitchEditMode({
  editMode,
  markupText,
  setEditMode,
  setMarkupText,
  updateSongAndStructureWithHistory,
}: UseSwitchEditModeParams) {
  const { song } = useSongContext();

  const serialize = useCallback(() => serializeSongToMarkup(song), [song]);
  const parse = useCallback(
    () => parseMarkupToSections(markupText, song),
    [markupText, song],
  );

  const switchEditMode = useCallback(
    (target: EditMode) => {
      if (target === editMode) return;

      if (
        (editMode === 'section' || editMode === 'phonetic') &&
        (target === 'text' || target === 'markdown')
      ) {
        setMarkupText(serialize());
        setEditMode(target);
        return;
      }

      if (
        target === 'section' &&
        (editMode === 'text' || editMode === 'markdown')
      ) {
        const newSections = parse();
        if (newSections.length > 0)
          updateSongAndStructureWithHistory(
            newSections,
            newSections.map(s => s.name),
          );
        setEditMode('section');
        return;
      }

      if (
        target === 'phonetic' &&
        (editMode === 'text' || editMode === 'markdown')
      ) {
        const newSections = parse();
        if (newSections.length > 0)
          updateSongAndStructureWithHistory(
            newSections,
            newSections.map(s => s.name),
          );
        setEditMode('phonetic');
        return;
      }

      // text ↔ markdown: same buffer, no conversion needed
      setEditMode(target);
    },
    [
      editMode,
      serialize,
      parse,
      setEditMode,
      setMarkupText,
      updateSongAndStructureWithHistory,
    ],
  );

  const handleMarkupToggle = useCallback(() => {
    switchEditMode(editMode === 'markdown' ? 'section' : 'markdown');
  }, [editMode, switchEditMode]);

  return { switchEditMode, handleMarkupToggle };
}

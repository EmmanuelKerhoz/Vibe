/**
 * useMarkupEditor
 * Composes useScrollToSection + useSwitchEditMode + the song→markup sync effect.
 * Use this hook when you need the full markup editor (sync + scroll + mode switch).
 * For lighter consumers, use useScrollToSection or useSwitchEditMode directly.
 */
import { useEffect, useRef } from 'react';
import { languageNameToCode } from '../constants/langFamilyMap';
import { useSongContext } from '../contexts/SongContext';
import type { UpdateSongAndStructureWithHistory } from './useSongHistoryState';
import { useScrollToSection } from './useScrollToSection';
import { useSwitchEditMode } from './useSwitchEditMode';
import { useSongMarkupSerializer } from './useSongMarkupSerializer';
import type { EditMode } from '../types';

interface UseMarkupEditorParams {
  editMode: EditMode;
  markupText: string;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setEditMode: (v: EditMode) => void;
  setMarkupText: (v: string) => void;
  updateSongAndStructureWithHistory: UpdateSongAndStructureWithHistory;
}

export function useMarkupEditor(params: UseMarkupEditorParams) {
  const { songLanguage } = useSongContext();
  const { song, serializeSong } = useSongMarkupSerializer();
  const lastHydratedMarkupRef = useRef('');
  const previousSongRef = useRef(song);
  const {
    editMode,
    markupText,
    markupTextareaRef,
    setEditMode,
    setMarkupText,
    updateSongAndStructureWithHistory,
  } = params;

  const normalizedSongLanguage = (
    languageNameToCode(songLanguage) ?? songLanguage
  )
    .trim()
    .toLowerCase();
  const markupDirection: 'ltr' | 'rtl' = ['ar', 'he', 'fa', 'ur'].includes(
    normalizedSongLanguage,
  )
    ? 'rtl'
    : 'ltr';

  // ── Atomic sub-hooks ─────────────────────────────────────────────────────
  const { scrollToSection } = useScrollToSection({
    editMode,
    markupText,
    markupTextareaRef,
  });

  const { switchEditMode, handleMarkupToggle } = useSwitchEditMode({
    editMode,
    markupText,
    setEditMode,
    setMarkupText,
    updateSongAndStructureWithHistory,
  });

  // ── Sync song → markupText ───────────────────────────────────────────────
  useEffect(() => {
    const songChanged = previousSongRef.current !== song;
    previousSongRef.current = song;

    if (editMode !== 'text' && editMode !== 'markdown') return;

    const serializedSong = serializeSong();
    if (!serializedSong.trim()) return;

    if (songChanged) {
      lastHydratedMarkupRef.current = serializedSong;
      if (markupText !== serializedSong) setMarkupText(serializedSong);
      return;
    }

    if (markupText.trim() !== '') {
      lastHydratedMarkupRef.current = serializedSong;
      return;
    }

    if (lastHydratedMarkupRef.current === serializedSong) return;

    lastHydratedMarkupRef.current = serializedSong;
    setMarkupText(serializedSong);
  }, [editMode, markupText, serializeSong, setMarkupText, song]);

  return { scrollToSection, handleMarkupToggle, switchEditMode, markupDirection };
}
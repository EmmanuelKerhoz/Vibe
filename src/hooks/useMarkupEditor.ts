import { useCallback, useEffect, useRef } from 'react';
import { serializeSongToMarkup, parseMarkupToSections } from '../utils/markupParser';
import { languageNameToCode } from '../constants/langFamilyMap';
import { useSongContext } from '../contexts/SongContext';
import type { EditMode } from '../types';

interface UseMarkupEditorParams {
  editMode: EditMode;
  markupText: string;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setEditMode: (v: EditMode) => void;
  setMarkupText: (v: string) => void;
  updateSongAndStructureWithHistory: (
    song: import('../types').Section[],
    structure: string[],
  ) => void;
}

export function useMarkupEditor(params: UseMarkupEditorParams) {
  const { song, songLanguage } = useSongContext();
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

  // ── Stable callbacks wrapping the pure utils ──────────────────────────────
  const serialize = useCallback(
    () => serializeSongToMarkup(song),
    [song],
  );

  const parse = useCallback(
    () => parseMarkupToSections(markupText, song),
    [markupText, song],
  );

  // ── Scroll helper ──────────────────────────────────────────────────
  const scrollToSection = useCallback(
    (section: import('../types').Section) => {
      if (editMode !== 'section') {
        if (!markupTextareaRef.current) return;
        let searchStr = `**[${section.name}]**`;
        let index = markupText.indexOf(searchStr);
        if (index === -1) {
          searchStr = `[${section.name}]`;
          index = markupText.indexOf(searchStr);
        }
        if (index !== -1) {
          const ta = markupTextareaRef.current;
          ta.focus();
          ta.setSelectionRange(index, index + searchStr.length);
          const rawLineHeight = window.getComputedStyle(ta).lineHeight;
          const lineHeight = parseFloat(rawLineHeight);
          const resolvedLineHeight = isFinite(lineHeight) ? lineHeight : 20;
          ta.scrollTop =
            (markupText.substring(0, index).split('\n').length - 2) *
            resolvedLineHeight;
        }
      } else {
        const el = document.getElementById(`section-${section.id}`);
        if (el) {
          const container = el.closest('.overflow-y-auto');
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            container.scrollTo({
              top: container.scrollTop + elRect.top - containerRect.top - 20,
              behavior: 'smooth',
            });
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    },
    [editMode, markupText, markupTextareaRef],
  );

  // ── Sync song → markupText ───────────────────────────────────────────
  useEffect(() => {
    const songChanged = previousSongRef.current !== song;
    previousSongRef.current = song;

    if (editMode !== 'text' && editMode !== 'markdown') return;

    const serializedSong = serialize();
    if (!serializedSong.trim()) return;

    if (songChanged) {
      lastHydratedMarkupRef.current = serializedSong;
      if (markupText !== serializedSong) setMarkupText(serializedSong);
      return;
    }

    // Guard against race condition: only hydrate when the editor is empty.
    // If the user has content in the editor (even a single non-whitespace
    // character), we never clobber it with the serialized song.
    if (markupText.trim() !== '') {
      lastHydratedMarkupRef.current = serializedSong;
      return;
    }

    if (lastHydratedMarkupRef.current === serializedSong) return;

    lastHydratedMarkupRef.current = serializedSong;
    setMarkupText(serializedSong);
  }, [editMode, markupText, serialize, setMarkupText, song]);

  // ── Mode switching ───────────────────────────────────────────────
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

  /** Convenience toggle: markdown ↔ section */
  const handleMarkupToggle = useCallback(() => {
    switchEditMode(editMode === 'markdown' ? 'section' : 'markdown');
  }, [editMode, switchEditMode]);

  return { scrollToSection, handleMarkupToggle, switchEditMode, markupDirection };
}

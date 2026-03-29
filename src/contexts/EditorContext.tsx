import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAudioFeedback } from '../hooks/useAudioFeedback';
import { useMarkupEditor } from '../hooks/useMarkupEditor';
import { useAppStateContext } from './AppStateContext';
import { useSongContext } from './SongContext';

type EditorContextValue = {
  editMode: ReturnType<typeof useAppStateContext>['appState']['editMode'];
  setEditMode: ReturnType<typeof useAppStateContext>['appState']['setEditMode'];
  markupText: ReturnType<typeof useAppStateContext>['appState']['markupText'];
  setMarkupText: ReturnType<typeof useAppStateContext>['appState']['setMarkupText'];
  markupTextareaRef: ReturnType<typeof useAppStateContext>['appState']['markupTextareaRef'];
  switchEditMode: ReturnType<typeof useMarkupEditor>['switchEditMode'];
  markupDirection: ReturnType<typeof useMarkupEditor>['markupDirection'];
  scrollToSection: ReturnType<typeof useMarkupEditor>['scrollToSection'];
  handleMarkupToggle: ReturnType<typeof useMarkupEditor>['handleMarkupToggle'];
  playAudioFeedback: ReturnType<typeof useAudioFeedback>['playAudioFeedback'];
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const { appState } = useAppStateContext();
  const { updateSongAndStructureWithHistory } = useSongContext();
  const {
    audioFeedback,
    editMode,
    setEditMode,
    markupText,
    setMarkupText,
    markupTextareaRef,
  } = appState;

  const { scrollToSection, handleMarkupToggle, switchEditMode, markupDirection } = useMarkupEditor({
    editMode,
    markupText,
    markupTextareaRef,
    setEditMode,
    setMarkupText,
    updateSongAndStructureWithHistory,
  });
  const { playAudioFeedback } = useAudioFeedback(audioFeedback);

  const value = useMemo<EditorContextValue>(() => ({
    editMode,
    setEditMode,
    markupText,
    setMarkupText,
    markupTextareaRef,
    switchEditMode,
    markupDirection,
    scrollToSection,
    handleMarkupToggle,
    playAudioFeedback,
  }), [
    editMode,
    setEditMode,
    markupText,
    setMarkupText,
    markupTextareaRef,
    switchEditMode,
    markupDirection,
    scrollToSection,
    handleMarkupToggle,
    playAudioFeedback,
  ]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used inside <EditorProvider>');
  return ctx;
}

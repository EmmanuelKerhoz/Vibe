/**
 * EditorContext
 *
 * Owns the editor-mode state and markup buffer that were previously
 * co-located in UIStateBag / ModalContext.
 *
 * Motivation: editMode and markupText change on every keystroke (text/markdown
 * modes) and on every mode switch. When these lived in UIStateBag they
 * invalidated ModalStateContext on every keystroke, triggering re-renders in
 * every modal-state consumer (TopRibbon, StatusBar, AppModals, …).
 *
 * By isolating them here, only components that explicitly subscribe to
 * EditorContext (LyricsView, InsightsBar, useMarkupEditor) re-render on
 * editor-state mutations.
 *
 * Provider placement: inside AppStateProvider (reads from appState),
 * outside ModalProvider (ModalProvider no longer receives these values).
 */
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { EditMode } from '../types';

export interface EditorContextValue {
  editMode: EditMode;
  setEditMode: (v: EditMode) => void;
  markupText: string;
  setMarkupText: (v: string) => void;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  markupDirection: 'ltr' | 'rtl';
}

const EditorContext = createContext<EditorContextValue | null>(null);

export interface EditorProviderProps {
  children: ReactNode;
  editMode: EditMode;
  setEditMode: (v: EditMode) => void;
  markupText: string;
  setMarkupText: (v: string) => void;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  markupDirection: 'ltr' | 'rtl';
}

export function EditorProvider({
  children,
  editMode,
  setEditMode,
  markupText,
  setMarkupText,
  markupTextareaRef,
  markupDirection,
}: EditorProviderProps) {
  const value = useMemo<EditorContextValue>(
    () => ({
      editMode,
      setEditMode,
      markupText,
      setMarkupText,
      markupTextareaRef,
      markupDirection,
    }),
    [editMode, setEditMode, markupText, setMarkupText, markupTextareaRef, markupDirection],
  );

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

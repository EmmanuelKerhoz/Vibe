// ---------------------------------------------------------------------------
// EditorContext.tsx — stable handler bag for LyricsView ↔ SectionEditor
// ---------------------------------------------------------------------------
// Eliminates 8 function props from SectionEditor, allowing React.memo to cut
// re-renders driven solely by new callback references from LyricsView.
// ---------------------------------------------------------------------------

import React, { createContext, useContext } from 'react';

export interface EditorContextValue {
  moveSectionUp:        (sectionId: string) => void;
  moveSectionDown:      (sectionId: string) => void;
  moveLineUp:           (sectionId: string, lineId: string) => void;
  moveLineDown:         (sectionId: string, lineId: string) => void;
  addLineToSection:     (sectionId: string) => void;
  deleteLineFromSection:(sectionId: string, lineId: string) => void;
  setSectionName:       (sectionId: string, name: string) => void;
  setSectionRhymeScheme:(sectionId: string, scheme: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorContextProvider = EditorContext.Provider;

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used inside EditorContextProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// EditorContext.tsx
// ---------------------------------------------------------------------------
// Fournit les 8 handlers locaux construits dans LyricsView aux descendants
// (SectionEditor, etc.) sans prop-drilling.
// ---------------------------------------------------------------------------

import React, { createContext, useContext } from 'react';
import type { Section } from '../types';

export interface EditorHandlers {
  moveSectionUp:        (sectionId: string) => void;
  moveSectionDown:      (sectionId: string) => void;
  moveLineUp:           (sectionId: string, lineId: string) => void;
  moveLineDown:         (sectionId: string, lineId: string) => void;
  addLineToSection:     (sectionId: string) => void;
  deleteLineFromSection:(sectionId: string, lineId: string) => void;
  setSectionName:       (sectionId: string, name: string) => void;
  setSectionRhymeScheme:(sectionId: string, scheme: string) => void;
}

const EditorContext = createContext<EditorHandlers | null>(null);

export const EditorContextProvider = EditorContext.Provider;

export function useEditorContext(): EditorHandlers {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used inside EditorContextProvider');
  return ctx;
}

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSongComposer } from '../hooks/useSongComposer';
import { useSongContext } from './SongContext';
import { useLanguage } from '../i18n';

type ComposerContextValue = ReturnType<typeof useSongComposer>;

const ComposerContext = createContext<ComposerContextValue | null>(null);

export function ComposerProvider({ children }: { children: ReactNode }) {
  const {
    song,
    structure,
    topic,
    mood,
    rhymeScheme,
    targetSyllables,
    title,
    genre,
    tempo,
    instrumentation,
    rhythm,
    narrative,
    songLanguage,
    setMusicalPrompt,
    setGenre,
    setTempo,
    setInstrumentation,
    setRhythm,
    setNarrative,
    updateState,
    updateSongWithHistory,
    updateSongAndStructureWithHistory,
    setShouldAutoGenerateTitle,
  } = useSongContext();
  const { language } = useLanguage();
  const composer = useSongComposer({
    song,
    structure,
    topic,
    mood,
    rhymeScheme,
    targetSyllables,
    title,
    genre,
    tempo,
    instrumentation,
    rhythm,
    narrative,
    songLanguage,
    uiLanguage: language,
    setMusicalPrompt,
    setGenre,
    setTempo,
    setInstrumentation,
    setRhythm,
    setNarrative,
    updateState,
    updateSongWithHistory,
    updateSongAndStructureWithHistory,
    requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });

  const value = useMemo(() => composer, [composer]);

  return (
    <ComposerContext.Provider value={value}>
      {children}
    </ComposerContext.Provider>
  );
}

export function useComposerContext(): ComposerContextValue {
  const context = useContext(ComposerContext);
  if (!context) throw new Error('useComposerContext must be used inside <ComposerProvider>');
  return context;
}

import React, { createContext, useContext, type ReactNode } from 'react';
import { useSongComposer } from '../hooks/useSongComposer';
import { useSongContext } from './SongContext';
import { useAppStateContext } from './AppStateContext';
import { useLanguage } from '../i18n';
import { getUiLanguageNameForAi } from '../i18n/constants';

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
    songDurationSeconds,
    timeSignature,
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
  const { appState } = useAppStateContext();
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
    songDurationSeconds,
    timeSignature,
    instrumentation,
    rhythm,
    narrative,
    songLanguage,
    uiLanguage: getUiLanguageNameForAi(language),
    setMusicalPrompt,
    setGenre,
    setTempo,
    setInstrumentation,
    setRhythm,
    setNarrative,
    hasApiKey: appState.hasApiKey,
    updateState,
    updateSongWithHistory,
    updateSongAndStructureWithHistory,
    requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
  });

  return (
    <ComposerContext.Provider value={composer}>
      {children}
    </ComposerContext.Provider>
  );
}

export function useComposerContext(): ComposerContextValue {
  const context = useContext(ComposerContext);
  if (!context) throw new Error('useComposerContext must be used inside <ComposerProvider>');
  return context;
}

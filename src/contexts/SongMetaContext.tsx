import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSongMeta } from '../hooks/useSongMeta';

type SongMetaContextValue = ReturnType<typeof useSongMeta>;

const SongMetaContext = createContext<SongMetaContextValue | null>(null);

export function SongMetaProvider({ children }: { children: ReactNode }) {
  const meta = useSongMeta();

  // Stable useState setters are included to satisfy react-hooks/exhaustive-deps.
  const value = useMemo<SongMetaContextValue>(
    () => ({
      title: meta.title,
      setTitle: meta.setTitle,
      titleOrigin: meta.titleOrigin,
      setTitleOrigin: meta.setTitleOrigin,
      topic: meta.topic,
      setTopic: meta.setTopic,
      mood: meta.mood,
      setMood: meta.setMood,
      rhymeScheme: meta.rhymeScheme,
      setRhymeScheme: meta.setRhymeScheme,
      targetSyllables: meta.targetSyllables,
      setTargetSyllables: meta.setTargetSyllables,
      newSectionName: meta.newSectionName,
      setNewSectionName: meta.setNewSectionName,
      shouldAutoGenerateTitle: meta.shouldAutoGenerateTitle,
      setShouldAutoGenerateTitle: meta.setShouldAutoGenerateTitle,
      songLanguage: meta.songLanguage,
      setSongLanguage: meta.setSongLanguage,
      detectedLanguages: meta.detectedLanguages,
      setDetectedLanguages: meta.setDetectedLanguages,
      lineLanguages: meta.lineLanguages,
      setLineLanguages: meta.setLineLanguages,
      genre: meta.genre,
      setGenre: meta.setGenre,
      tempo: meta.tempo,
      setTempo: meta.setTempo,
      instrumentation: meta.instrumentation,
      setInstrumentation: meta.setInstrumentation,
      rhythm: meta.rhythm,
      setRhythm: meta.setRhythm,
      narrative: meta.narrative,
      setNarrative: meta.setNarrative,
      musicalPrompt: meta.musicalPrompt,
      setMusicalPrompt: meta.setMusicalPrompt,
    }),
    [
      meta.title, meta.setTitle, meta.titleOrigin, meta.setTitleOrigin,
      meta.topic, meta.setTopic, meta.mood, meta.setMood,
      meta.rhymeScheme, meta.setRhymeScheme, meta.targetSyllables, meta.setTargetSyllables,
      meta.newSectionName, meta.setNewSectionName,
      meta.shouldAutoGenerateTitle, meta.setShouldAutoGenerateTitle,
      meta.songLanguage, meta.setSongLanguage,
      meta.detectedLanguages, meta.setDetectedLanguages,
      meta.lineLanguages, meta.setLineLanguages,
      meta.genre, meta.setGenre, meta.tempo, meta.setTempo,
      meta.instrumentation, meta.setInstrumentation,
      meta.rhythm, meta.setRhythm,
      meta.narrative, meta.setNarrative,
      meta.musicalPrompt, meta.setMusicalPrompt,
    ],
  );

  return (
    <SongMetaContext.Provider value={value}>
      {children}
    </SongMetaContext.Provider>
  );
}

export function useSongMetaContext(): SongMetaContextValue {
  const context = useContext(SongMetaContext);
  if (!context) throw new Error('useSongMetaContext must be used inside <SongMetaProvider>');
  return context;
}

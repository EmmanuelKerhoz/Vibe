import { useCallback } from 'react';
import type { Section } from '../types';
import type { SimilarityMatch } from '../utils/similarityUtils';
import { buildResetPayload, buildPartialResetPayload, clearPersistedSession } from '../utils/sessionReset';
import { createEmptySong } from '../utils/songDefaults';
import { useSongMetaContext } from '../contexts/SongMetaContext';

type StateBag = {
  setHasSavedSession: (v: boolean) => void;
  setMarkupText: (v: string) => void;
  setActiveTab: (v: 'lyrics' | 'musical') => void;
  setIsLeftPanelOpen: (v: boolean) => void;
  setSimilarityMatches: (v: SimilarityMatch[]) => void;
};

type UseSessionActionsParams = {
  song: ReturnType<typeof createEmptySong>;
  structure: string[];
  rhymeScheme: string;
  appState: StateBag;
  replaceStateWithoutHistory: (song: ReturnType<typeof createEmptySong>, structure: string[]) => void;
  clearHistory: () => void;
  clearSelection: () => void;
  resetWebSimilarityIndex: () => void;
  resetSuggestionCycle: () => void;
  updateSongAndStructureWithHistory: (song: Section[], structure: string[]) => void;
  setIsResetModalOpen: (v: boolean) => void;
};

const applyResetPayload = (
  payload: ReturnType<typeof buildResetPayload>,
  replaceStateWithoutHistory: (song: ReturnType<typeof createEmptySong>, structure: string[]) => void,
  clearHistory: () => void,
  clearSelection: () => void,
  resetWebSimilarityIndex: () => void,
  appState: StateBag,
  songMetaSetters: {
    setTitle: (v: string) => void;
    setTitleOrigin: (v: 'user' | 'ai') => void;
    setTopic: (v: string) => void;
    setMood: (v: string) => void;
    setRhymeScheme: (v: string) => void;
    setTargetSyllables: (v: number) => void;
    setGenre: (v: string) => void;
    setTempo: (v: number) => void;
    setInstrumentation: (v: string) => void;
    setRhythm: (v: string) => void;
    setNarrative: (v: string) => void;
    setMusicalPrompt: (v: string) => void;
  },
) => {
  replaceStateWithoutHistory(payload.song, payload.structure);
  clearHistory();
  clearPersistedSession();
  clearSelection();
  appState.setHasSavedSession(payload.hasSavedSession);
  songMetaSetters.setTitle(payload.title);
  songMetaSetters.setTitleOrigin(payload.titleOrigin);
  songMetaSetters.setTopic(payload.topic);
  songMetaSetters.setMood(payload.mood);
  songMetaSetters.setRhymeScheme(payload.rhymeScheme);
  songMetaSetters.setTargetSyllables(payload.targetSyllables);
  songMetaSetters.setGenre(payload.genre);
  songMetaSetters.setTempo(payload.tempo);
  songMetaSetters.setInstrumentation(payload.instrumentation);
  songMetaSetters.setRhythm(payload.rhythm);
  songMetaSetters.setNarrative(payload.narrative);
  songMetaSetters.setMusicalPrompt(payload.musicalPrompt);
  appState.setMarkupText(payload.markupText);
  appState.setActiveTab(payload.activeTab);
  appState.setIsLeftPanelOpen(payload.isLeftPanelOpen);
  appState.setSimilarityMatches(payload.similarityMatches);
  resetWebSimilarityIndex();
};

export const useSessionActions = (params: UseSessionActionsParams) => {
  const {
    rhymeScheme,
    appState,
    replaceStateWithoutHistory,
    clearHistory,
    clearSelection,
    resetWebSimilarityIndex,
    resetSuggestionCycle,
    updateSongAndStructureWithHistory,
    setIsResetModalOpen,
  } = params;

  const {
    setTitle, setTitleOrigin, setTopic, setMood, setRhymeScheme,
    setTargetSyllables, setGenre, setTempo, setInstrumentation,
    setRhythm, setNarrative, setMusicalPrompt,
  } = useSongMetaContext();

  const songMetaSetters = {
    setTitle, setTitleOrigin, setTopic, setMood, setRhymeScheme,
    setTargetSyllables, setGenre, setTempo, setInstrumentation,
    setRhythm, setNarrative, setMusicalPrompt,
  };

  const handleCreateEmptySong = useCallback(() => {
    applyResetPayload(
      buildResetPayload('AABB'),
      replaceStateWithoutHistory,
      clearHistory,
      clearSelection,
      resetWebSimilarityIndex,
      appState,
      songMetaSetters,
    );
    resetSuggestionCycle();
  }, [
    appState, clearHistory, clearSelection, replaceStateWithoutHistory,
    resetSuggestionCycle, resetWebSimilarityIndex,
    setTitle, setTitleOrigin, setTopic, setMood, setRhymeScheme,
    setTargetSyllables, setGenre, setTempo, setInstrumentation,
    setRhythm, setNarrative, setMusicalPrompt,
  ]);

  const resetSong = useCallback(() => {
    const partial = buildPartialResetPayload(rhymeScheme);
    updateSongAndStructureWithHistory(partial.song, partial.structure);
    clearPersistedSession();
    appState.setHasSavedSession(false);
    clearSelection();
    setTitle(partial.title);
    setTitleOrigin(partial.titleOrigin);
    setTopic(partial.topic);
    setMood(partial.mood);
    appState.setMarkupText('');
    appState.setSimilarityMatches([]);
    resetWebSimilarityIndex();
    resetSuggestionCycle();
    setIsResetModalOpen(false);
  }, [
    appState, clearSelection, resetSuggestionCycle, resetWebSimilarityIndex,
    rhymeScheme, setIsResetModalOpen, updateSongAndStructureWithHistory,
    setTitle, setTitleOrigin, setTopic, setMood,
  ]);

  return { handleCreateEmptySong, resetSong };
};

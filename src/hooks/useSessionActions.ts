import { useCallback } from 'react';
import type { Section } from '../types';
import type { SimilarityMatch } from '../utils/similarityUtils';
import { buildResetPayload, buildPartialResetPayload, clearPersistedSession } from '../utils/sessionReset';
import { createEmptySong } from '../utils/songDefaults';

type StateBag = {
  setHasSavedSession: (v: boolean) => void;
  setTitle: (v: string) => void;
  setTitleOrigin: (v: 'user' | 'ai') => void;
  setTopic: (v: string) => void;
  setMood: (v: string) => void;
  setRhymeScheme: (v: string) => void;
  setTargetSyllables: (v: number) => void;
  setGenre: (v: string) => void;
  setTempo: (v: string) => void;
  setInstrumentation: (v: string) => void;
  setRhythm: (v: string) => void;
  setNarrative: (v: string) => void;
  setMusicalPrompt: (v: string) => void;
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
) => {
  replaceStateWithoutHistory(payload.song, payload.structure);
  clearHistory();
  clearPersistedSession();
  clearSelection();
  appState.setHasSavedSession(payload.hasSavedSession);
  appState.setTitle(payload.title);
  appState.setTitleOrigin(payload.titleOrigin);
  appState.setTopic(payload.topic);
  appState.setMood(payload.mood);
  appState.setRhymeScheme(payload.rhymeScheme);
  appState.setTargetSyllables(payload.targetSyllables);
  appState.setGenre(payload.genre);
  appState.setTempo(payload.tempo);
  appState.setInstrumentation(payload.instrumentation);
  appState.setRhythm(payload.rhythm);
  appState.setNarrative(payload.narrative);
  appState.setMusicalPrompt(payload.musicalPrompt);
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

  const handleCreateEmptySong = useCallback(() => {
    applyResetPayload(
      buildResetPayload('AABB'),
      replaceStateWithoutHistory,
      clearHistory,
      clearSelection,
      resetWebSimilarityIndex,
      appState,
    );
    resetSuggestionCycle();
  }, [appState, clearHistory, clearSelection, replaceStateWithoutHistory, resetSuggestionCycle, resetWebSimilarityIndex]);

  const resetSong = useCallback(() => {
    const partial = buildPartialResetPayload(rhymeScheme);
    updateSongAndStructureWithHistory(partial.song, partial.structure);
    clearPersistedSession();
    appState.setHasSavedSession(false);
    clearSelection();
    appState.setTitle(partial.title);
    appState.setTitleOrigin(partial.titleOrigin);
    appState.setTopic(partial.topic);
    appState.setMood(partial.mood);
    appState.setMarkupText('');
    appState.setSimilarityMatches([]);
    resetWebSimilarityIndex();
    resetSuggestionCycle();
    setIsResetModalOpen(false);
  }, [appState, clearSelection, resetSuggestionCycle, resetWebSimilarityIndex, rhymeScheme, setIsResetModalOpen, updateSongAndStructureWithHistory]);

  return { handleCreateEmptySong, resetSong };
};

import { useCallback } from 'react';
import type { Section } from '../types';
import type { SimilarityMatch } from '../utils/similarityUtils';
import { buildResetPayload, buildPartialResetPayload, clearPersistedSession } from '../utils/sessionReset';
import { createEmptySong } from '../utils/songDefaults';
import { useSongContext } from '../contexts/SongContext';

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
  songMeta: {
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
  songMeta.setTitle(payload.title);
  songMeta.setTitleOrigin(payload.titleOrigin);
  songMeta.setTopic(payload.topic);
  songMeta.setMood(payload.mood);
  songMeta.setRhymeScheme(payload.rhymeScheme);
  songMeta.setTargetSyllables(payload.targetSyllables);
  songMeta.setGenre(payload.genre);
  songMeta.setTempo(payload.tempo);
  songMeta.setInstrumentation(payload.instrumentation);
  songMeta.setRhythm(payload.rhythm);
  songMeta.setNarrative(payload.narrative);
  songMeta.setMusicalPrompt(payload.musicalPrompt);
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
    setTitle, setTitleOrigin, setTopic, setMood, setRhymeScheme, setTargetSyllables,
    setGenre, setTempo, setInstrumentation, setRhythm, setNarrative, setMusicalPrompt,
  } = useSongContext();

  const songMeta = {
    setTitle, setTitleOrigin, setTopic, setMood, setRhymeScheme, setTargetSyllables,
    setGenre, setTempo, setInstrumentation, setRhythm, setNarrative, setMusicalPrompt,
  };

  const handleCreateEmptySong = useCallback(() => {
    applyResetPayload(
      buildResetPayload('AABB'),
      replaceStateWithoutHistory,
      clearHistory,
      clearSelection,
      resetWebSimilarityIndex,
      appState,
      songMeta,
    );
    resetSuggestionCycle();
  }, [appState, clearHistory, clearSelection, replaceStateWithoutHistory, resetSuggestionCycle, resetWebSimilarityIndex, songMeta]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [appState, clearSelection, resetSuggestionCycle, resetWebSimilarityIndex, rhymeScheme, setIsResetModalOpen, setMood, setTitle, setTitleOrigin, setTopic, updateSongAndStructureWithHistory]);

  return { handleCreateEmptySong, resetSong };
};

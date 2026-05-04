import { useMemo, useState } from 'react';
import type { Section } from '../types';
import { useAiGeneration } from './composer/useAiGeneration';
import { useSuggestions } from './composer/useSuggestions';
import { useLineEditor } from './composer/useLineEditor';
import { useMusicalPrompt } from './composer/useMusicalPrompt';

type UseSongComposerParams = {
  song: Section[];
  structure: string[];
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  title: string;
  genre: string;
  tempo: number;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  songLanguage: string;
  uiLanguage: string;
  hasApiKey: boolean;
  setMusicalPrompt: (value: string) => void;
  setGenre: (value: string) => void;
  setTempo: (value: number) => void;
  setInstrumentation: (value: string) => void;
  setRhythm: (value: string) => void;
  setNarrative: (value: string) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateSongWithHistory: (newSong: Section[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  requestAutoTitleGeneration: () => void;
};

export const useSongComposer = ({
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
  uiLanguage,
  hasApiKey,
  setMusicalPrompt,
  setGenre,
  setTempo,
  setInstrumentation,
  setRhythm,
  setNarrative,
  updateState,
  updateSongWithHistory,
  updateSongAndStructureWithHistory,
  requestAutoTitleGeneration,
}: UseSongComposerParams) => {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const { suggestions, isSuggesting, setSuggestions, generateSuggestions, applySuggestion } =
    useSuggestions({
      song,
      topic,
      mood,
      rhymeScheme,
      targetSyllables,
      songLanguage: songLanguage || '',
      hasApiKey,
      selectedLineId,
      updateState,
    });

  const { isGenerating, isRegeneratingSection, generateSong, regenerateSection, quantizeSyllables } =
    useAiGeneration({
      song,
      structure,
      topic,
      mood,
      rhymeScheme,
      targetSyllables,
      title,
      songLanguage,
      uiLanguage,
      updateState,
      updateSongWithHistory,
      updateSongAndStructureWithHistory,
      requestAutoTitleGeneration,
      setSelectedLineId,
    });

  const {
    updateLineText,
    handleLineKeyDown,
    handleLineClick,
    addInstruction,
    removeInstruction,
    handleInstructionChange,
    clearSelection,
  } = useLineEditor({
    song,
    updateState,
    selectedLineId,
    setSelectedLineId,
    generateSuggestions,
    setSuggestions,
  });

  const { isGeneratingMusicalPrompt, isAnalyzingLyrics, generateMusicalPrompt, analyzeLyricsForMusic, coherenceResult, dismissCoherenceResult } =
    useMusicalPrompt({
      song,
      title,
      topic,
      mood,
      genre,
      tempo,
      instrumentation,
      rhythm,
      narrative,
      songLanguage: songLanguage || '',
      setMusicalPrompt,
      setGenre,
      setTempo,
      setInstrumentation,
      setRhythm,
      setNarrative,
    });

  return useMemo(() => ({
    isGenerating,
    isRegeneratingSection,
    isGeneratingMusicalPrompt,
    isAnalyzingLyrics,
    selectedLineId,
    setSelectedLineId,
    suggestions,
    isSuggesting,
    generateSong,
    regenerateSection,
    quantizeSyllables,
    generateSuggestions,
    updateLineText,
    handleLineKeyDown,
    applySuggestion,
    generateMusicalPrompt,
    analyzeLyricsForMusic,
    handleLineClick,
    handleInstructionChange,
    addInstruction,
    removeInstruction,
    clearSelection,
    coherenceResult,
    dismissCoherenceResult,
  }), [
    isGenerating, isRegeneratingSection, isGeneratingMusicalPrompt, isAnalyzingLyrics,
    selectedLineId, setSelectedLineId, suggestions, isSuggesting,
    generateSong, regenerateSection, quantizeSyllables, generateSuggestions,
    updateLineText, handleLineKeyDown, applySuggestion,
    generateMusicalPrompt, analyzeLyricsForMusic,
    handleLineClick, handleInstructionChange, addInstruction, removeInstruction, clearSelection,
    coherenceResult, dismissCoherenceResult,
  ]);
};

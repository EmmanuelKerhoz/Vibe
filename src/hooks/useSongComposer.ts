import { useState } from 'react';
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
  tempo: string;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  songLanguage: string;
  uiLanguage: string;
  setMusicalPrompt: (value: string) => void;
  setGenre: (value: string) => void;
  setTempo: (value: string) => void;
  setInstrumentation: (value: string) => void;
  setRhythm: (value: string) => void;
  setNarrative: (value: string) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateSongWithHistory: (newSong: Section[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  saveVersion: (name: string, snapshot?: {
    song: Section[];
    structure: string[];
    title: string;
    titleOrigin: 'user' | 'ai';
    topic: string;
    mood: string;
  }) => void;
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
  setMusicalPrompt,
  setGenre,
  setTempo,
  setInstrumentation,
  setRhythm,
  setNarrative,
  updateState,
  updateSongWithHistory,
  updateSongAndStructureWithHistory,
  saveVersion: _saveVersion,
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
      songLanguage,
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

  const { isGeneratingMusicalPrompt, isAnalyzingLyrics, generateMusicalPrompt, analyzeLyricsForMusic } =
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
      songLanguage,
      setMusicalPrompt,
      setGenre,
      setTempo,
      setInstrumentation,
      setRhythm,
      setNarrative,
    });

  return {
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
  };
};

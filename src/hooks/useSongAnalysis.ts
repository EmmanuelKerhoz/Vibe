import { useState } from 'react';
import type { Section } from '../types';
import { usePasteImport } from './analysis/usePasteImport';
import { useLanguageAdapter } from './analysis/useLanguageAdapter';
import { useSongAnalysisEngine } from './analysis/useSongAnalysisEngine';

type UseSongAnalysisParams = {
  song: Section[];
  topic: string;
  mood: string;
  rhymeScheme: string;
  uiLanguage: string;
  isGenerating?: boolean;
  /** Elevated state from useAppState — shared with useSongComposer */
  songLanguage: string;
  setSongLanguage: (lang: string) => void;
  setTopic: (value: string) => void;
  setMood: (value: string) => void;
  saveVersion: (name: string, snapshot?: {
    song: Section[];
    structure: string[];
    title: string;
    titleOrigin: 'user' | 'ai';
    topic: string;
    mood: string;
  }) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  clearLineSelection: () => void;
  requestAutoTitleGeneration: () => void;
};

export const useSongAnalysis = ({
  song,
  topic,
  mood,
  rhymeScheme,
  uiLanguage,
  isGenerating = false,
  songLanguage,
  setSongLanguage,
  setTopic,
  setMood,
  saveVersion,
  updateState,
  updateSongAndStructureWithHistory,
  clearLineSelection,
  requestAutoTitleGeneration,
}: UseSongAnalysisParams) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const languageAdapter = useLanguageAdapter({
    song,
    uiLanguage,
    saveVersion,
    updateSongAndStructureWithHistory,
    updateState,
    isGenerating,
    songLanguage,
    setSongLanguage,
  });

  const pasteImport = usePasteImport({
    rhymeScheme,
    uiLanguage,
    updateSongAndStructureWithHistory,
    setTopic,
    setMood,
    currentSongLanguage: languageAdapter.songLanguage,
    onLanguageMismatch: languageAdapter.setTargetLanguage,
    requestAutoTitleGeneration,
    clearLineSelection,
    setIsAnalyzing,
  });

  const analysisEngine = useSongAnalysisEngine({
    song,
    topic,
    mood,
    uiLanguage,
    saveVersion,
    updateSongAndStructureWithHistory,
    setTopic,
    setMood,
    setIsAnalyzing,
  });

  return {
    isPasteModalOpen: pasteImport.isPasteModalOpen,
    setIsPasteModalOpen: pasteImport.setIsPasteModalOpen,
    pastedText: pasteImport.pastedText,
    setPastedText: pasteImport.setPastedText,
    isAnalyzing,
    isAnalysisModalOpen: analysisEngine.isAnalysisModalOpen,
    setIsAnalysisModalOpen: analysisEngine.setIsAnalysisModalOpen,
    analysisReport: analysisEngine.analysisReport,
    analysisSteps: analysisEngine.analysisSteps,
    appliedAnalysisItems: analysisEngine.appliedAnalysisItems,
    selectedAnalysisItems: analysisEngine.selectedAnalysisItems,
    isApplyingAnalysis: analysisEngine.isApplyingAnalysis,
    isAnalyzingTheme: analysisEngine.isAnalyzingTheme,
    songLanguage: languageAdapter.songLanguage,
    targetLanguage: languageAdapter.targetLanguage,
    setTargetLanguage: languageAdapter.setTargetLanguage,
    sectionTargetLanguages: languageAdapter.sectionTargetLanguages,
    setSectionTargetLanguages: languageAdapter.setSectionTargetLanguages,
    isDetectingLanguage: languageAdapter.isDetectingLanguage,
    isAdaptingLanguage: languageAdapter.isAdaptingLanguage,
    adaptationProgress: languageAdapter.adaptationProgress,
    adaptationResult: languageAdapter.adaptationResult,
    toggleAnalysisItemSelection: analysisEngine.toggleAnalysisItemSelection,
    applySelectedAnalysisItems: analysisEngine.applySelectedAnalysisItems,
    applyAnalysisItem: analysisEngine.applyAnalysisItem,
    analyzeCurrentSong: analysisEngine.analyzeCurrentSong,
    detectLanguage: languageAdapter.detectLanguage,
    adaptSongLanguage: languageAdapter.adaptSongLanguage,
    adaptSectionLanguage: languageAdapter.adaptSectionLanguage,
    analyzePastedLyrics: pasteImport.analyzePastedLyrics,
    clearAppliedAnalysisItems: analysisEngine.clearAppliedAnalysisItems,
  };
};

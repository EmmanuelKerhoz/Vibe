import { useState } from 'react';
import type { RefObject } from 'react';
import type { Section } from '../types';
import { usePasteImport } from './analysis/usePasteImport';
import { useLanguageAdapter } from './analysis/useLanguageAdapter';
import { useSongAnalysisEngine } from './analysis/useSongAnalysisEngine';
import { useSongContext } from '../contexts/SongContext';

type UseSongAnalysisParams = {
  uiLanguage: string;
  isGeneratingRef: RefObject<boolean>;
  /** Elevated state from useAppState — shared with useSongComposer */
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
  setIsPasteModalOpen: (value: boolean) => void;
  setIsAnalysisModalOpen: (value: boolean) => void;
};

export const useSongAnalysis = ({
  uiLanguage,
  isGeneratingRef,
  saveVersion,
  updateState,
  updateSongAndStructureWithHistory,
  clearLineSelection,
  requestAutoTitleGeneration,
  setIsPasteModalOpen,
  setIsAnalysisModalOpen,
}: UseSongAnalysisParams) => {
  const {
    song,
    topic,
    mood,
    rhymeScheme,
    songLanguage,
    setSongLanguage,
    detectedLanguages,
    setDetectedLanguages,
    lineLanguages,
    setLineLanguages,
    setTopic,
    setMood,
  } = useSongContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const languageAdapter = useLanguageAdapter({
    song,
    uiLanguage,
    saveVersion,
    updateSongAndStructureWithHistory,
    updateState,
    isGeneratingRef,
    songLanguage,
    setSongLanguage,
    detectedLanguages,
    setDetectedLanguages,
    lineLanguages,
    setLineLanguages,
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
    setIsPasteModalOpen,
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
    setIsAnalysisModalOpen,
  });

  return {
    // ── Paste import ────────────────────────────────────────────────────────
    canPasteLyrics: pasteImport.canPasteLyrics,
    pastedText: pasteImport.pastedText,
    setPastedText: pasteImport.setPastedText,
    analyzePastedLyrics: pasteImport.analyzePastedLyrics,
    // ── Analysis state ──────────────────────────────────────────────────────
    isAnalyzing,
    analysisReport: analysisEngine.analysisReport,
    analysisSteps: analysisEngine.analysisSteps,
    appliedAnalysisItems: analysisEngine.appliedAnalysisItems,
    selectedAnalysisItems: analysisEngine.selectedAnalysisItems,
    isApplyingAnalysis: analysisEngine.isApplyingAnalysis,
    toggleAnalysisItemSelection: analysisEngine.toggleAnalysisItemSelection,
    applySelectedAnalysisItems: analysisEngine.applySelectedAnalysisItems,
    analyzeCurrentSong: analysisEngine.analyzeCurrentSong,
    clearAppliedAnalysisItems: analysisEngine.clearAppliedAnalysisItems,
    // ── Language adapter ────────────────────────────────────────────────────
    songLanguage: languageAdapter.songLanguage,
    targetLanguage: languageAdapter.targetLanguage,
    setTargetLanguage: languageAdapter.setTargetLanguage,
    sectionTargetLanguages: languageAdapter.sectionTargetLanguages,
    setSectionTargetLanguages: languageAdapter.setSectionTargetLanguages,
    isDetectingLanguage: languageAdapter.isDetectingLanguage,
    isAdaptingLanguage: languageAdapter.isAdaptingLanguage,
    adaptationProgress: languageAdapter.adaptationProgress,
    adaptationResult: languageAdapter.adaptationResult,
    detectLanguage: languageAdapter.detectLanguage,
    adaptSongLanguage: languageAdapter.adaptSongLanguage,
    adaptSectionLanguage: languageAdapter.adaptSectionLanguage,
    // ── @internal: non consommés par App.tsx — conserver pour les tests ────
    // TODO: brancher isAnalyzingTheme sur InsightsBar ou supprimer
    // TODO: brancher applyAnalysisItem sur un futur point d'usage ou supprimer
    isAnalyzingTheme: analysisEngine.isAnalyzingTheme,
    applyAnalysisItem: analysisEngine.applyAnalysisItem,
  };
};

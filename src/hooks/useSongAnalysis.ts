import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { Section } from '../types';
import type { AdaptationLangId } from '../i18n/constants';
import { usePasteImport } from './analysis/usePasteImport';
import { useLanguageAdapter } from './analysis/useLanguageAdapter';
import { useSongAnalysisEngine } from './analysis/useSongAnalysisEngine';
import { useSongContext } from '../contexts/SongContext';
import { useAnalysisCounter } from './useAnalysisCounter';

type UseSongAnalysisParams = {
  uiLanguage: string;
  isGeneratingRef: RefObject<boolean>;
  hasApiKey: boolean;
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
  hasApiKey,
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
    setTitle,
    setTitleOrigin,
  } = useSongContext();

  const { isAnalyzing, setIsAnalyzingForSubhook } = useAnalysisCounter();

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
    hasApiKey,
  });

  const handleDetectedLanguage = useCallback((language: string, sectionIds: string[]) => {
    languageAdapter.setSongLanguage(language);
    // language is a plain string from AI detection; cast to AdaptationLangId so
    // the sectionTargetLanguages map stays uniformly typed. Consumers that need
    // a validated langId must run migrateAdaptationToLangId independently.
    const mapping: Record<string, AdaptationLangId> = {};
    for (const id of sectionIds) { mapping[id] = language as AdaptationLangId; }
    languageAdapter.setSectionTargetLanguages(prev => ({ ...prev, ...mapping }));
  }, [languageAdapter]);

  const handleSetSongTitle = useCallback((value: string) => {
    setTitle(value);
    setTitleOrigin('user');
  }, [setTitle, setTitleOrigin]);

  const pasteImport = usePasteImport({
    rhymeScheme,
    uiLanguage,
    updateSongAndStructureWithHistory,
    setTopic,
    setMood,
    setSongTitle: handleSetSongTitle,
    currentSongLanguage: languageAdapter.songLanguage,
    onLanguageMismatch: languageAdapter.setTargetLanguage,
    onDetectedLanguage: handleDetectedLanguage,
    requestAutoTitleGeneration,
    clearLineSelection,
    setIsAnalyzing: setIsAnalyzingForSubhook,
    setIsPasteModalOpen,
    hasApiKey,
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
    setIsAnalyzing: setIsAnalyzingForSubhook,
    setIsAnalysisModalOpen,
    hasApiKey,
  });

  return {
    // ── Paste import ────────────────────────────────────────────────────────
    canPasteLyrics: pasteImport.canPasteLyrics,
    pastedText: pasteImport.pastedText,
    setPastedText: pasteImport.setPastedText,
    importProgress: pasteImport.importProgress,
    analyzePastedLyrics: pasteImport.analyzePastedLyrics,
    // ── Analysis state ──────────────────────────────────────────────────────
    isAnalyzing,
    isAnalyzingTheme: analysisEngine.isAnalyzingTheme,
    analysisReport: analysisEngine.analysisReport,
    analysisSteps: analysisEngine.analysisSteps,
    appliedAnalysisItems: analysisEngine.appliedAnalysisItems,
    selectedAnalysisItems: analysisEngine.selectedAnalysisItems,
    isApplyingAnalysis: analysisEngine.isApplyingAnalysis,
    toggleAnalysisItemSelection: analysisEngine.toggleAnalysisItemSelection,
    applyAnalysisItem: analysisEngine.applyAnalysisItem,
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
    adaptingLineIds: languageAdapter.adaptingLineIds,
    adaptationProgress: languageAdapter.adaptationProgress,
    adaptationResult: languageAdapter.adaptationResult,
    detectLanguage: languageAdapter.detectLanguage,
    adaptSongLanguage: languageAdapter.adaptSongLanguage,
    adaptSectionLanguage: languageAdapter.adaptSectionLanguage,
    adaptLineLanguage: languageAdapter.adaptLineLanguage,
  };
};

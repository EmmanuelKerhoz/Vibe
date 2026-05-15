/**
 * InsightsBarContext
 *
 * Carries all InsightsBar state that cannot be sourced from existing
 * contexts (SongContext, ComposerContext, TranslationAdaptationContext).
 *
 * Mounted once in AppEditorLayout, split into action and state sub-contexts
 * so volatile state only re-renders the consumers that need it.
 *
 * Note: webSimilarityIndex is intentionally absent from this context.
 * SimilarityButton reads it directly from useSimilarityContext() to avoid
 * re-rendering the entire InsightsBar subtree on every similarity engine run.
 */
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AdaptationProgress, AdaptationResult } from '../hooks/analysis/useLanguageAdapter';
import type { AdaptationLangId } from '../i18n/constants';
import type { EditMode } from '../types';

export interface InsightsBarActionsContextValue {
  // Language adaptation
  setTargetLanguage: (v: AdaptationLangId) => void;
  adaptSongLanguage: (lang: AdaptationLangId) => void;
  detectLanguage: () => void;
  // Analysis
  analyzeCurrentSong: () => void;
  // Edit mode
  editMode: EditMode;
  switchEditMode: (mode: EditMode) => void;
  // Similarity (badge label only — index is read directly from SimilarityContext)
  setIsSimilarityModalOpen: (v: boolean) => void;
  // Callbacks
  onOpenSearch: () => void;
  onToggleAnalysisPanel: () => void;
  // Metronome (optional — MusicalTab owns it but InsightsBar shows the button)
  toggleMetronome?: () => void;
}

export interface InsightsBarStateContextValue {
  // Language adaptation
  targetLanguage: AdaptationLangId;
  isAdaptingLanguage: boolean;
  isDetectingLanguage: boolean;
  adaptationProgress: AdaptationProgress;
  adaptationResult: AdaptationResult | null;
  // Analysis
  isAnalyzing: boolean;
  // Similarity (badge label only — index is read directly from SimilarityContext)
  webBadgeLabel: string | null;
  // Library
  libraryCount: number;
  // API / panels
  isAnalysisPanelOpen: boolean;
  hasApiKey: boolean;
  // Metronome (optional — MusicalTab owns it but InsightsBar shows the button)
  isMetronomeActive?: boolean;
}

export interface InsightsBarContextValue extends InsightsBarActionsContextValue, InsightsBarStateContextValue {}

const InsightsBarActionsContext = createContext<InsightsBarActionsContextValue | null>(null);
const InsightsBarStateContext = createContext<InsightsBarStateContextValue | null>(null);

export function InsightsBarProvider({
  children,
  value,
}: { children: ReactNode; value: InsightsBarContextValue }) {
  const actionsValue = useMemo<InsightsBarActionsContextValue>(() => ({
    setTargetLanguage: value.setTargetLanguage,
    adaptSongLanguage: value.adaptSongLanguage,
    detectLanguage: value.detectLanguage,
    analyzeCurrentSong: value.analyzeCurrentSong,
    editMode: value.editMode,
    switchEditMode: value.switchEditMode,
    setIsSimilarityModalOpen: value.setIsSimilarityModalOpen,
    onOpenSearch: value.onOpenSearch,
    onToggleAnalysisPanel: value.onToggleAnalysisPanel,
    ...(value.toggleMetronome !== undefined ? { toggleMetronome: value.toggleMetronome } : {}),
  }), [
    value.setTargetLanguage,
    value.adaptSongLanguage,
    value.detectLanguage,
    value.analyzeCurrentSong,
    value.editMode,
    value.switchEditMode,
    value.setIsSimilarityModalOpen,
    value.onOpenSearch,
    value.onToggleAnalysisPanel,
    value.toggleMetronome,
  ]);

  const stateValue = useMemo<InsightsBarStateContextValue>(() => ({
    targetLanguage: value.targetLanguage,
    isAdaptingLanguage: value.isAdaptingLanguage,
    isDetectingLanguage: value.isDetectingLanguage,
    adaptationProgress: value.adaptationProgress,
    adaptationResult: value.adaptationResult,
    isAnalyzing: value.isAnalyzing,
    webBadgeLabel: value.webBadgeLabel,
    libraryCount: value.libraryCount,
    isAnalysisPanelOpen: value.isAnalysisPanelOpen,
    hasApiKey: value.hasApiKey,
    ...(value.isMetronomeActive !== undefined ? { isMetronomeActive: value.isMetronomeActive } : {}),
  }), [
    value.targetLanguage,
    value.isAdaptingLanguage,
    value.isDetectingLanguage,
    value.adaptationProgress,
    value.adaptationResult,
    value.isAnalyzing,
    value.webBadgeLabel,
    value.libraryCount,
    value.isAnalysisPanelOpen,
    value.hasApiKey,
    value.isMetronomeActive,
  ]);

  return (
    <InsightsBarActionsContext.Provider value={actionsValue}>
      <InsightsBarStateContext.Provider value={stateValue}>
        {children}
      </InsightsBarStateContext.Provider>
    </InsightsBarActionsContext.Provider>
  );
}

export function useInsightsBarActionsContext(): InsightsBarActionsContextValue {
  const ctx = useContext(InsightsBarActionsContext);
  if (!ctx) throw new Error('useInsightsBarActionsContext must be used within InsightsBarProvider');
  return ctx;
}

export function useInsightsBarStateContext(): InsightsBarStateContextValue {
  const ctx = useContext(InsightsBarStateContext);
  if (!ctx) throw new Error('useInsightsBarStateContext must be used within InsightsBarProvider');
  return ctx;
}

export function useInsightsBarContext(): InsightsBarContextValue {
  const actions = useInsightsBarActionsContext();
  const state = useInsightsBarStateContext();
  return {
    ...state,
    ...actions,
  };
}

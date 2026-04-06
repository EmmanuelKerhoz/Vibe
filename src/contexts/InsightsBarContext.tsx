/**
 * InsightsBarContext
 *
 * Carries all InsightsBar state that cannot be sourced from existing
 * contexts (SongContext, ComposerContext, TranslationAdaptationContext).
 *
 * Mounted once in AppEditorLayout, consumed directly by InsightsBar
 * and its sub-components — eliminates the 17-prop relay through AppEditorZone.
 *
 * Note: webSimilarityIndex is intentionally absent from this context.
 * SimilarityButton reads it directly from useSimilarityContext() to avoid
 * re-rendering the entire InsightsBar subtree on every similarity engine run.
 */
import React, { createContext, useContext, type ReactNode } from 'react';
import type { AdaptationProgress, AdaptationResult } from '../hooks/analysis/useLanguageAdapter';
import type { EditMode } from '../types';

export interface InsightsBarContextValue {
  // Language adaptation
  targetLanguage: string;
  setTargetLanguage: (v: string) => void;
  isAdaptingLanguage: boolean;
  isDetectingLanguage: boolean;
  adaptSongLanguage: (lang: string) => void;
  detectLanguage: () => void;
  adaptationProgress: AdaptationProgress;
  adaptationResult: AdaptationResult | null;
  // Analysis
  isAnalyzing: boolean;
  analyzeCurrentSong: () => void;
  // Edit mode
  editMode: EditMode;
  switchEditMode: (mode: EditMode) => void;
  // Similarity (badge label only — index is read directly from SimilarityContext)
  webBadgeLabel: string | null;
  setIsSimilarityModalOpen: (v: boolean) => void;
  // Library
  libraryCount: number;
  // Callbacks
  onOpenSearch: () => void;
  onToggleAnalysisPanel: () => void;
  isAnalysisPanelOpen: boolean;
  hasApiKey: boolean;
  // Metronome (optional — MusicalTab owns it but InsightsBar shows the button)
  isMetronomeActive?: boolean;
  toggleMetronome?: () => void;
}

const InsightsBarContext = createContext<InsightsBarContextValue | null>(null);

export function InsightsBarProvider({
  children,
  value,
}: { children: ReactNode; value: InsightsBarContextValue }) {
  return (
    <InsightsBarContext.Provider value={value}>
      {children}
    </InsightsBarContext.Provider>
  );
}

export function useInsightsBarContext(): InsightsBarContextValue {
  const ctx = useContext(InsightsBarContext);
  if (!ctx) throw new Error('useInsightsBarContext must be used within InsightsBarProvider');
  return ctx;
}

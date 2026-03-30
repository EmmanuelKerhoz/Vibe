import React, { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { useAnalysisContext } from './AnalysisContext';
import { useAppStateContext } from './AppStateContext';

export interface TranslationAdaptationContextValue {
  sectionTargetLanguages: Record<string, string>;
  onSectionTargetLanguageChange: (sectionId: string, lang: string) => void;
  adaptSectionLanguage: (sectionId: string, newLanguage: string) => void;
  adaptLineLanguage: (sectionId: string, lineId: string, newLanguage: string) => void;
  adaptingLineIds: Set<string>;
  showTranslationFeatures: boolean;
}

const TranslationAdaptationContext = createContext<TranslationAdaptationContextValue | null>(null);

export function TranslationAdaptationProvider({ children }: { children: ReactNode }) {
  const { appState } = useAppStateContext();
  const {
    sectionTargetLanguages,
    setSectionTargetLanguages,
    adaptSectionLanguage,
    adaptLineLanguage,
    adaptingLineIds,
  } = useAnalysisContext();
  const adaptingLineIdSet = useMemo(
    () => adaptingLineIds instanceof Set ? adaptingLineIds : new Set<string>(),
    [adaptingLineIds],
  );

  const onSectionTargetLanguageChange = useCallback((sectionId: string, lang: string) => {
    setSectionTargetLanguages(prev => ({ ...prev, [sectionId]: lang }));
  }, [setSectionTargetLanguages]);

  const adaptingLineIdsKey = useMemo(
    () => JSON.stringify([...adaptingLineIdSet].sort()),
    [adaptingLineIdSet],
  );
  const adaptingLineIdsRef = useRef<Set<string>>(new Set());
  const stableAdaptingLineIds = useMemo(() => {
    adaptingLineIdsRef.current = new Set(JSON.parse(adaptingLineIdsKey) as string[]);
    return adaptingLineIdsRef.current;
  }, [adaptingLineIdsKey]);

  const value = useMemo<TranslationAdaptationContextValue>(() => ({
    sectionTargetLanguages,
    onSectionTargetLanguageChange,
    adaptSectionLanguage,
    adaptLineLanguage,
    adaptingLineIds: stableAdaptingLineIds,
    showTranslationFeatures: appState.showTranslationFeatures,
  }), [
    sectionTargetLanguages,
    onSectionTargetLanguageChange,
    adaptSectionLanguage,
    adaptLineLanguage,
    stableAdaptingLineIds,
    appState.showTranslationFeatures,
  ]);

  return (
    <TranslationAdaptationContext.Provider value={value}>
      {children}
    </TranslationAdaptationContext.Provider>
  );
}

export function useTranslationAdaptationContext(): TranslationAdaptationContextValue {
  const ctx = useContext(TranslationAdaptationContext);
  if (!ctx) {
    throw new Error('useTranslationAdaptationContext must be used inside <TranslationAdaptationProvider>');
  }
  return ctx;
}

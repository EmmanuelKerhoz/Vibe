import React, { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';

export interface TranslationAdaptationContextValue {
  sectionTargetLanguages: Record<string, string>;
  onSectionTargetLanguageChange: (sectionId: string, lang: string) => void;
  adaptSectionLanguage: (sectionId: string, newLanguage: string) => void;
  adaptLineLanguage: (sectionId: string, lineId: string, newLanguage: string) => void;
  adaptingLineIds: Set<string>;
  showTranslationFeatures: boolean;
}

interface TranslationAdaptationProviderProps extends Partial<TranslationAdaptationContextValue> {
  children: ReactNode;
}

const EMPTY_SET = new Set<string>();
const NOOP = () => {};
const DEFAULT_CONTEXT_VALUE: TranslationAdaptationContextValue = {
  sectionTargetLanguages: {},
  onSectionTargetLanguageChange: NOOP,
  adaptSectionLanguage: NOOP,
  adaptLineLanguage: NOOP,
  adaptingLineIds: EMPTY_SET,
  showTranslationFeatures: true,
};

const TranslationAdaptationContext = createContext<TranslationAdaptationContextValue>(DEFAULT_CONTEXT_VALUE);

export function TranslationAdaptationProvider({
  children,
  sectionTargetLanguages = DEFAULT_CONTEXT_VALUE.sectionTargetLanguages,
  onSectionTargetLanguageChange = DEFAULT_CONTEXT_VALUE.onSectionTargetLanguageChange,
  adaptSectionLanguage = DEFAULT_CONTEXT_VALUE.adaptSectionLanguage,
  adaptLineLanguage = DEFAULT_CONTEXT_VALUE.adaptLineLanguage,
  adaptingLineIds = DEFAULT_CONTEXT_VALUE.adaptingLineIds,
  showTranslationFeatures = DEFAULT_CONTEXT_VALUE.showTranslationFeatures,
}: TranslationAdaptationProviderProps) {
  const adaptingLineIdsKey = useMemo(
    () => JSON.stringify(Array.from(adaptingLineIds).sort()),
    [adaptingLineIds],
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
    showTranslationFeatures,
  }), [
    sectionTargetLanguages,
    onSectionTargetLanguageChange,
    adaptSectionLanguage,
    adaptLineLanguage,
    stableAdaptingLineIds,
    showTranslationFeatures,
  ]);

  return (
    <TranslationAdaptationContext.Provider value={value}>
      {children}
    </TranslationAdaptationContext.Provider>
  );
}

export function useTranslationAdaptationContext(): TranslationAdaptationContextValue {
  return useContext(TranslationAdaptationContext);
}

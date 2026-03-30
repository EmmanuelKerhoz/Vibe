import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  type AdaptationProgress,
  type AdaptationResult,
  IDLE_PROGRESS,
} from '../hooks/analysis/languageAdapterTypes';

export interface LanguageAdaptationContextValue {
  targetLanguage: string;
  setTargetLanguage: Dispatch<SetStateAction<string>>;
  sectionTargetLanguages: Record<string, string>;
  setSectionTargetLanguages: Dispatch<SetStateAction<Record<string, string>>>;
  isDetectingLanguage: boolean;
  setIsDetectingLanguage: Dispatch<SetStateAction<boolean>>;
  isAdaptingLanguage: boolean;
  setIsAdaptingLanguage: Dispatch<SetStateAction<boolean>>;
  adaptingLineIds: Set<string>;
  setAdaptingLineIds: Dispatch<SetStateAction<Set<string>>>;
  adaptationProgress: AdaptationProgress;
  setAdaptationProgress: Dispatch<SetStateAction<AdaptationProgress>>;
  adaptationResult: AdaptationResult | null;
  setAdaptationResult: Dispatch<SetStateAction<AdaptationResult | null>>;
}

const LanguageAdaptationContext = createContext<LanguageAdaptationContextValue | null>(null);

export function LanguageAdaptationProvider({ children }: { children: ReactNode }) {
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [sectionTargetLanguages, setSectionTargetLanguages] = useState<Record<string, string>>({});
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [isAdaptingLanguage, setIsAdaptingLanguage] = useState(false);
  const [adaptingLineIds, setAdaptingLineIds] = useState<Set<string>>(new Set());
  const [adaptationProgress, setAdaptationProgress] = useState<AdaptationProgress>(IDLE_PROGRESS);
  const [adaptationResult, setAdaptationResult] = useState<AdaptationResult | null>(null);

  const value = useMemo<LanguageAdaptationContextValue>(
    () => ({
      targetLanguage,
      setTargetLanguage,
      sectionTargetLanguages,
      setSectionTargetLanguages,
      isDetectingLanguage,
      setIsDetectingLanguage,
      isAdaptingLanguage,
      setIsAdaptingLanguage,
      adaptingLineIds,
      setAdaptingLineIds,
      adaptationProgress,
      setAdaptationProgress,
      adaptationResult,
      setAdaptationResult,
    }),
    [
      targetLanguage,
      sectionTargetLanguages,
      isDetectingLanguage,
      isAdaptingLanguage,
      adaptingLineIds,
      adaptationProgress,
      adaptationResult,
    ],
  );

  return (
    <LanguageAdaptationContext.Provider value={value}>
      {children}
    </LanguageAdaptationContext.Provider>
  );
}

export function useLanguageAdaptationContext(): LanguageAdaptationContextValue {
  const context = useContext(LanguageAdaptationContext);
  if (!context) {
    throw new Error('useLanguageAdaptationContext must be used inside <LanguageAdaptationProvider>');
  }
  return context;
}

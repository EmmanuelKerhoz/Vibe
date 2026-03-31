/**
 * SimilarityContext
 * Single source of truth for the web-similarity engine.
 * Eliminates the duplicate useSimilarityEngine calls (App.tsx + AppModalLayer.tsx)
 * and their independent AbortControllers / debounce timers.
 */
import React, { createContext, useContext, type ReactNode } from 'react';
import { useSimilarityEngine } from '../hooks/useSimilarityEngine';
import { useAppStateContext } from './AppStateContext';

type SimilarityValue = ReturnType<typeof useSimilarityEngine>;

const SimilarityContext = createContext<SimilarityValue | null>(null);

export function SimilarityProvider({ children }: { children: ReactNode }) {
  const { appState } = useAppStateContext();
  const value = useSimilarityEngine({ hasApiKey: appState.hasApiKey });
  return (
    <SimilarityContext.Provider value={value}>
      {children}
    </SimilarityContext.Provider>
  );
}

export function useSimilarityContext(): SimilarityValue {
  const ctx = useContext(SimilarityContext);
  if (!ctx) {
    throw new Error('useSimilarityContext must be used within a SimilarityProvider');
  }
  return ctx;
}

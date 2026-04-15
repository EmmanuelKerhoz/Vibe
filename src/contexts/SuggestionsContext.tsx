/**
 * SuggestionsContext
 *
 * Aggregates all state consumed by SuggestionsPanel so the component
 * sources its data from context instead of receiving 8 drilled props.
 *
 * Sources:
 *   - ComposerContext   → selectedLineId, setSelectedLineId, suggestions,
 *                         isSuggesting, applySuggestion, generateSuggestions
 *   - AppStateContext   → hasApiKey
 *   - spellCheck        → injected by AppEditorLayout (instantiated in
 *                         useEditorState, not in a context — passed as value)
 *
 * Mount point: AppEditorLayout, inside ComposerParamsProvider so that the
 * provider tree stays consistent with the existing context hierarchy.
 *
 * Note: exactOptionalPropertyTypes is enabled in tsconfig.
 * synonyms and isSynonymsLoading are declared without `?` in the context
 * value interface and coalesced to their zero values in the useMemo so that
 * `undefined` never leaks into the typed value shape (TS2375).
 */
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useComposerContext } from './ComposerContext';
import { useAppStateContext } from './AppStateContext';
import type { UseSpellCheckReturn } from '../hooks/composer/useSpellCheck';

export interface SuggestionsContextValue {
  selectedLineId: string | null;
  setSelectedLineId: (id: string | null) => void;
  suggestions: string[];
  isSuggesting: boolean;
  hasApiKey: boolean;
  applySuggestion: (s: string) => void;
  generateSuggestions: (lineId: string) => void;
  spellCheck: UseSpellCheckReturn | undefined;
  /** null = not loaded / cleared; populated = synonyms available. */
  synonyms: Record<string, string[]> | null;
  isSynonymsLoading: boolean;
}

const SuggestionsContext = createContext<SuggestionsContextValue | null>(null);

interface SuggestionsProviderProps {
  children: ReactNode;
  /** Passed from AppEditorLayout — instantiated in useEditorState. */
  spellCheck?: UseSpellCheckReturn;
  synonyms?: Record<string, string[]> | null;
  isSynonymsLoading?: boolean;
}

export function SuggestionsProvider({
  children,
  spellCheck,
  synonyms,
  isSynonymsLoading,
}: SuggestionsProviderProps) {
  const composerCtx = useComposerContext();
  const { appState } = useAppStateContext();

  const value = useMemo<SuggestionsContextValue>(
    () => ({
      selectedLineId: composerCtx.selectedLineId,
      setSelectedLineId: composerCtx.setSelectedLineId,
      suggestions: composerCtx.suggestions,
      isSuggesting: composerCtx.isSuggesting,
      hasApiKey: appState.hasApiKey,
      applySuggestion: composerCtx.applySuggestion,
      generateSuggestions: composerCtx.generateSuggestions,
      spellCheck,
      synonyms: synonyms ?? null,
      isSynonymsLoading: isSynonymsLoading ?? false,
    }),
    [
      composerCtx.selectedLineId,
      composerCtx.setSelectedLineId,
      composerCtx.suggestions,
      composerCtx.isSuggesting,
      composerCtx.applySuggestion,
      composerCtx.generateSuggestions,
      appState.hasApiKey,
      spellCheck,
      synonyms,
      isSynonymsLoading,
    ],
  );

  return (
    <SuggestionsContext.Provider value={value}>
      {children}
    </SuggestionsContext.Provider>
  );
}

export function useSuggestionsContext(): SuggestionsContextValue {
  const ctx = useContext(SuggestionsContext);
  if (!ctx) throw new Error('useSuggestionsContext must be used inside <SuggestionsProvider>');
  return ctx;
}

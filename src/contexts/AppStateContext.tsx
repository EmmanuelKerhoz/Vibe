/**
 * AppStateContext
 *
 * Splits the app-wide state bag into two independently memoised sub-values
 * so that consumers subscribing only to navigation/session state are not
 * re-rendered by modal-toggle churn, and vice-versa.
 *
 * Sub-values:
 *   appState          — full bag from useAppState (session + UI state).
 *                       Consumers that need multiple slices should use this.
 *   uiStateForProvider — UIStateBag fed to ModalProvider. Stable reference
 *                        when modal setters are stable (they are, because
 *                        useState setters have referential stability).
 *
 * Selector hooks:
 *   useAppStateContext()        — full value (backward-compat, no change)
 *   useAppNavigationContext()   — { activeTab, setActiveTab,
 *                                   isStructureOpen, setIsStructureOpen,
 *                                   isLeftPanelOpen, setIsLeftPanelOpen }
 *                                 Re-renders only on navigation mutations.
 */
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { RefObject } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useUIStateForProvider } from '../hooks/useUIStateForProvider';
import type { UIStateBag } from './ModalContext';

type AppStateBag = ReturnType<typeof useAppState>;

interface AppStateContextValue {
  appState: AppStateBag;
  uiStateForProvider: UIStateBag;
}

export interface AppNavigationValue {
  activeTab: 'lyrics' | 'musical';
  setActiveTab: (v: 'lyrics' | 'musical') => void;
  isStructureOpen: boolean;
  setIsStructureOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);
const AppNavigationContext = createContext<AppNavigationValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const appState = useAppState();

  // Feed appState directly — useUIStateForProvider owns the single useMemo.
  // The previous intermediate `uiSlice` useMemo was redundant (double O(N)
  // allocation + invalidation on every modal toggle).
  const uiStateForProvider = useUIStateForProvider({
    setIsAboutOpen: appState.setIsAboutOpen,
    setIsSettingsOpen: appState.setIsSettingsOpen,
    setApiErrorModal: appState.setApiErrorModal,
    setIsImportModalOpen: appState.setIsImportModalOpen,
    setIsExportModalOpen: appState.setIsExportModalOpen,
    setIsSectionDropdownOpen: appState.setIsSectionDropdownOpen,
    setIsSimilarityModalOpen: appState.setIsSimilarityModalOpen,
    setIsSaveToLibraryModalOpen: appState.setIsSaveToLibraryModalOpen,
    setIsVersionsModalOpen: appState.setIsVersionsModalOpen,
    setIsResetModalOpen: appState.setIsResetModalOpen,
    setIsKeyboardShortcutsModalOpen: appState.setIsKeyboardShortcutsModalOpen,
    setConfirmModal: appState.setConfirmModal,
    setPromptModal: appState.setPromptModal,
    setIsPasteModalOpen: appState.setIsPasteModalOpen,
    setIsAnalysisModalOpen: appState.setIsAnalysisModalOpen,
    setIsSearchReplaceOpen: appState.setIsSearchReplaceOpen,
    setIsAnalysisPanelOpen: appState.setIsAnalysisPanelOpen,
    setActiveTab: appState.setActiveTab,
    setIsStructureOpen: appState.setIsStructureOpen,
    setIsLeftPanelOpen: appState.setIsLeftPanelOpen,
    isAboutOpen: appState.isAboutOpen,
    isSettingsOpen: appState.isSettingsOpen,
    apiErrorModal: appState.apiErrorModal,
    isImportModalOpen: appState.isImportModalOpen,
    isExportModalOpen: appState.isExportModalOpen,
    isSectionDropdownOpen: appState.isSectionDropdownOpen,
    isSimilarityModalOpen: appState.isSimilarityModalOpen,
    isSaveToLibraryModalOpen: appState.isSaveToLibraryModalOpen,
    isVersionsModalOpen: appState.isVersionsModalOpen,
    isResetModalOpen: appState.isResetModalOpen,
    isKeyboardShortcutsModalOpen: appState.isKeyboardShortcutsModalOpen,
    confirmModal: appState.confirmModal,
    promptModal: appState.promptModal,
    isPasteModalOpen: appState.isPasteModalOpen,
    isAnalysisModalOpen: appState.isAnalysisModalOpen,
    isSearchReplaceOpen: appState.isSearchReplaceOpen,
    isAnalysisPanelOpen: appState.isAnalysisPanelOpen,
    activeTab: appState.activeTab,
    isStructureOpen: appState.isStructureOpen,
    isLeftPanelOpen: appState.isLeftPanelOpen,
    importInputRef: appState.importInputRef as RefObject<HTMLInputElement>,
  });

  const contextValue = useMemo(
    () => ({ appState, uiStateForProvider }),
    [appState, uiStateForProvider],
  );

  const navigationValue = useMemo<AppNavigationValue>(
    () => ({
      activeTab: appState.activeTab,
      setActiveTab: appState.setActiveTab,
      isStructureOpen: appState.isStructureOpen,
      setIsStructureOpen: appState.setIsStructureOpen,
      isLeftPanelOpen: appState.isLeftPanelOpen,
      setIsLeftPanelOpen: appState.setIsLeftPanelOpen,
    }),
    [
      appState.activeTab,
      appState.setActiveTab,
      appState.isStructureOpen,
      appState.setIsStructureOpen,
      appState.isLeftPanelOpen,
      appState.setIsLeftPanelOpen,
    ],
  );

  return (
    <AppStateContext.Provider value={contextValue}>
      <AppNavigationContext.Provider value={navigationValue}>
        {children}
      </AppNavigationContext.Provider>
    </AppStateContext.Provider>
  );
}

/** Full app state — backward-compatible. */
export function useAppStateContext(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppStateContext must be used inside <AppStateProvider>');
  return ctx;
}

/**
 * Selector hook: navigation state only.
 * Consumers re-render only on tab / panel mutations, not on modal toggles
 * or session state changes.
 */
export function useAppNavigationContext(): AppNavigationValue {
  const ctx = useContext(AppNavigationContext);
  if (!ctx) throw new Error('useAppNavigationContext must be used inside <AppStateProvider>');
  return ctx;
}

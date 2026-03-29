import React, { createContext, useContext, type ReactNode } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useUIStateForProvider } from '../hooks/useUIStateForProvider';
import type { UIStateBag } from './ModalContext';

type AppStateBag = ReturnType<typeof useAppState>;

interface AppStateContextValue {
  appState: AppStateBag;
  uiStateForProvider: UIStateBag;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const appState = useAppState();

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
    setEditMode: appState.setEditMode,
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
    activeTab: appState.activeTab,
    setActiveTab: appState.setActiveTab,
    isStructureOpen: appState.isStructureOpen,
    setIsStructureOpen: appState.setIsStructureOpen,
    isLeftPanelOpen: appState.isLeftPanelOpen,
    setIsLeftPanelOpen: appState.setIsLeftPanelOpen,
    editMode: appState.editMode,
    markupText: appState.markupText,
    setMarkupText: appState.setMarkupText,
    markupTextareaRef: appState.markupTextareaRef,
    importInputRef: appState.importInputRef,
    shouldAutoGenerateTitle: appState.shouldAutoGenerateTitle,
    setShouldAutoGenerateTitle: appState.setShouldAutoGenerateTitle,
  });

  return (
    <AppStateContext.Provider value={{ appState, uiStateForProvider }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppStateContext(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppStateContext must be used inside <AppStateProvider>');
  return ctx;
}

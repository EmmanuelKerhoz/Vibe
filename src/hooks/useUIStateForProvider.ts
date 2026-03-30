/**
 * useUIStateForProvider
 *
 * Produces a stable UIStateBag reference for ModalProvider.
 *
 * editMode / setEditMode / markupText / setMarkupText / markupTextareaRef
 * have been moved to EditorContext and are no longer part of UIStateBag.
 * This reduces the dep array from 36 to 31 entries, eliminating keystroke-
 * triggered invalidation of ModalStateContext.
 *
 * useState setters have referential stability across renders, so they do
 * not contribute to invalidation in practice.
 */
import { useMemo } from 'react';
import type { UIStateSlice } from '../contexts/UIStateSlice';
import type { UIStateBag } from '../contexts/ModalContext';

export const useUIStateForProvider = (bag: UIStateSlice): UIStateBag => {
  const {
    setIsAboutOpen, setIsSettingsOpen, setApiErrorModal,
    setIsImportModalOpen, setIsExportModalOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen, setIsSaveToLibraryModalOpen, setIsVersionsModalOpen,
    setIsResetModalOpen, setIsKeyboardShortcutsModalOpen,
    setConfirmModal, setPromptModal, setIsPasteModalOpen,
    setIsAnalysisModalOpen, setIsSearchReplaceOpen,
    isAboutOpen, isSettingsOpen, apiErrorModal,
    isImportModalOpen, isExportModalOpen, isSectionDropdownOpen,
    isSimilarityModalOpen, isSaveToLibraryModalOpen, isVersionsModalOpen,
    isResetModalOpen, isKeyboardShortcutsModalOpen,
    confirmModal, promptModal, isPasteModalOpen,
    isAnalysisModalOpen, isSearchReplaceOpen,
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    importInputRef,
  } = bag;

  return useMemo(() => ({
    setIsAboutOpen, setIsSettingsOpen, setApiErrorModal,
    setIsImportModalOpen, setIsExportModalOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen, setIsSaveToLibraryModalOpen, setIsVersionsModalOpen,
    setIsResetModalOpen, setIsKeyboardShortcutsModalOpen,
    setConfirmModal, setPromptModal, setIsPasteModalOpen,
    setIsAnalysisModalOpen, setIsSearchReplaceOpen,
    isAboutOpen, isSettingsOpen, apiErrorModal,
    isImportModalOpen, isExportModalOpen, isSectionDropdownOpen,
    isSimilarityModalOpen, isSaveToLibraryModalOpen, isVersionsModalOpen,
    isResetModalOpen, isKeyboardShortcutsModalOpen,
    confirmModal, promptModal, isPasteModalOpen,
    isAnalysisModalOpen, isSearchReplaceOpen,
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    importInputRef,
  }), [
    setIsAboutOpen, setIsSettingsOpen, setApiErrorModal,
    setIsImportModalOpen, setIsExportModalOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen, setIsSaveToLibraryModalOpen, setIsVersionsModalOpen,
    setIsResetModalOpen, setIsKeyboardShortcutsModalOpen,
    setConfirmModal, setPromptModal, setIsPasteModalOpen,
    setIsAnalysisModalOpen, setIsSearchReplaceOpen,
    isAboutOpen, isSettingsOpen, apiErrorModal,
    isImportModalOpen, isExportModalOpen, isSectionDropdownOpen,
    isSimilarityModalOpen, isSaveToLibraryModalOpen, isVersionsModalOpen,
    isResetModalOpen, isKeyboardShortcutsModalOpen,
    confirmModal, promptModal, isPasteModalOpen,
    isAnalysisModalOpen, isSearchReplaceOpen,
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    importInputRef,
  ]);
};

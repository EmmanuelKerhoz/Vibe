/**
 * useUIStateForProvider
 *
 * Produces a stable UIStateBag reference for ModalProvider.
 *
 * Previous implementation used 5 nested useMemo calls (4 sub-groups + 1
 * fusion). The fusion useMemo([modalState, layoutState, textState, refs])
 * invalidated the entire bag whenever any sub-group changed, making the
 * grouping cosmetic and providing no real memoisation benefit.
 *
 * This version uses a single flat useMemo with precise individual
 * dependencies. React can perform a shallow comparison on each dependency
 * and bail out correctly — one invalidation surface, no layered overhead.
 *
 * Note: useState setters (setIsAboutOpen, etc.) have referential stability
 * across renders, so they do not contribute to invalidation in practice.
 */
import { useMemo } from 'react';
import type { UIStateBag } from '../contexts/ModalContext';

export const useUIStateForProvider = (bag: UIStateBag): UIStateBag => {
  const {
    setIsAboutOpen, setIsSettingsOpen, setApiErrorModal,
    setIsImportModalOpen, setIsExportModalOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen, setIsSaveToLibraryModalOpen, setIsVersionsModalOpen,
    setIsResetModalOpen, setIsKeyboardShortcutsModalOpen,
    setConfirmModal, setPromptModal, setIsPasteModalOpen,
    setIsAnalysisModalOpen, setIsSearchReplaceOpen, setEditMode,
    isAboutOpen, isSettingsOpen, apiErrorModal,
    isImportModalOpen, isExportModalOpen, isSectionDropdownOpen,
    isSimilarityModalOpen, isSaveToLibraryModalOpen, isVersionsModalOpen,
    isResetModalOpen, isKeyboardShortcutsModalOpen,
    confirmModal, promptModal, isPasteModalOpen,
    isAnalysisModalOpen, isSearchReplaceOpen,
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    editMode, markupText, setMarkupText,
    markupTextareaRef, importInputRef,
  } = bag;

  return useMemo(() => ({
    setIsAboutOpen, setIsSettingsOpen, setApiErrorModal,
    setIsImportModalOpen, setIsExportModalOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen, setIsSaveToLibraryModalOpen, setIsVersionsModalOpen,
    setIsResetModalOpen, setIsKeyboardShortcutsModalOpen,
    setConfirmModal, setPromptModal, setIsPasteModalOpen,
    setIsAnalysisModalOpen, setIsSearchReplaceOpen, setEditMode,
    isAboutOpen, isSettingsOpen, apiErrorModal,
    isImportModalOpen, isExportModalOpen, isSectionDropdownOpen,
    isSimilarityModalOpen, isSaveToLibraryModalOpen, isVersionsModalOpen,
    isResetModalOpen, isKeyboardShortcutsModalOpen,
    confirmModal, promptModal, isPasteModalOpen,
    isAnalysisModalOpen, isSearchReplaceOpen,
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    editMode, markupText, setMarkupText,
    markupTextareaRef, importInputRef,
  }), [
    setIsAboutOpen, setIsSettingsOpen, setApiErrorModal,
    setIsImportModalOpen, setIsExportModalOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen, setIsSaveToLibraryModalOpen, setIsVersionsModalOpen,
    setIsResetModalOpen, setIsKeyboardShortcutsModalOpen,
    setConfirmModal, setPromptModal, setIsPasteModalOpen,
    setIsAnalysisModalOpen, setIsSearchReplaceOpen, setEditMode,
    isAboutOpen, isSettingsOpen, apiErrorModal,
    isImportModalOpen, isExportModalOpen, isSectionDropdownOpen,
    isSimilarityModalOpen, isSaveToLibraryModalOpen, isVersionsModalOpen,
    isResetModalOpen, isKeyboardShortcutsModalOpen,
    confirmModal, promptModal, isPasteModalOpen,
    isAnalysisModalOpen, isSearchReplaceOpen,
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    editMode, markupText, setMarkupText,
    markupTextareaRef, importInputRef,
  ]);
};

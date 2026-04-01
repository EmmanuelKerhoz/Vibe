import { useEffect } from 'react';
import { useModalDispatch, useModalState } from '../contexts/ModalContext';

export type KeyboardShortcutCategory = 'edit' | 'navigation' | 'file' | 'ai';

export type KeyboardShortcutId =
  | 'undo'
  | 'redo'
  | 'dismissReset'
  | 'dismissNavigation'
  | 'dismissFileDialogs'
  | 'dismissAiDialogs'
  | 'openSearch';

export type KeyboardShortcutModifier = 'ctrlOrMeta' | 'shift' | 'alt';

export interface KeyboardShortcutCombo {
  key: string;
  modifiers: readonly KeyboardShortcutModifier[];
}

export interface KeyboardShortcutMetadata {
  id: KeyboardShortcutId;
  category: KeyboardShortcutCategory;
  combos: readonly KeyboardShortcutCombo[];
}

export const KEYBOARD_SHORTCUTS_METADATA: readonly KeyboardShortcutMetadata[] = [
  {
    id: 'undo',
    category: 'edit',
    combos: [{ key: 'Z', modifiers: ['ctrlOrMeta'] }],
  },
  {
    id: 'redo',
    category: 'edit',
    combos: [{ key: 'Z', modifiers: ['ctrlOrMeta', 'shift'] }],
  },
  {
    id: 'dismissReset',
    category: 'edit',
    combos: [{ key: 'Escape', modifiers: [] }],
  },
  {
    id: 'dismissNavigation',
    category: 'navigation',
    combos: [{ key: 'Escape', modifiers: [] }],
  },
  {
    id: 'dismissFileDialogs',
    category: 'file',
    combos: [{ key: 'Escape', modifiers: [] }],
  },
  {
    id: 'dismissAiDialogs',
    category: 'ai',
    combos: [{ key: 'Escape', modifiers: [] }],
  },
  {
    id: 'openSearch',
    category: 'edit',
    combos: [{ key: 'f', modifiers: ['ctrlOrMeta'] }],
  },
] as const;

type UseKeyboardShortcutsParams = {
  isMobileOrTablet: boolean;
  closeMobilePanels: () => void;
  undo: () => void;
  redo: () => void;
};

export const useKeyboardShortcuts = ({
  isMobileOrTablet,
  closeMobilePanels,
  undo,
  redo,
}: UseKeyboardShortcutsParams) => {
  // Split hooks: dispatch refs are stable (never trigger re-renders on modal
  // state changes); state is read separately only where needed.
  const { closeModal, openModal } = useModalDispatch();
  const { uiState } = useModalState();
  const {
    promptModal,
    confirmModal,
    apiErrorModal,
    isResetModalOpen,
    isVersionsModalOpen,
    isSaveToLibraryModalOpen,
    isSimilarityModalOpen,
    isAnalysisModalOpen,
    isPasteModalOpen,
    isExportModalOpen,
    isImportModalOpen,
    isSettingsOpen,
    isAboutOpen,
    isSearchReplaceOpen,
    setPromptModal,
    setConfirmModal,
    setApiErrorModal,
    setIsResetModalOpen,
    setIsVersionsModalOpen,
    setIsSaveToLibraryModalOpen,
    setIsSimilarityModalOpen,
    setIsAnalysisModalOpen,
    setIsPasteModalOpen,
    setIsExportModalOpen,
    setIsImportModalOpen,
    setIsSettingsOpen,
    setIsAboutOpen,
    setIsSearchReplaceOpen,
  } = uiState;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') {
        if (isSearchReplaceOpen) { closeModal('searchReplace'); return; }
        if (promptModal?.open) { setPromptModal(null); return; }
        if (confirmModal?.open) { setConfirmModal(null); return; }
        if (apiErrorModal.open) { closeModal('apiError'); return; }
        if (isResetModalOpen) { closeModal('reset'); return; }
        if (isVersionsModalOpen) { closeModal('versions'); return; }
        if (isSaveToLibraryModalOpen) { closeModal('saveToLibrary'); return; }
        if (isSimilarityModalOpen) { closeModal('similarity'); return; }
        if (isAnalysisModalOpen) { closeModal('analysis'); return; }
        if (isPasteModalOpen) { closeModal('paste'); return; }
        if (isExportModalOpen) { closeModal('export'); return; }
        if (isImportModalOpen) { closeModal('import'); return; }
        if (isSettingsOpen) { closeModal('settings'); return; }
        if (isAboutOpen) { closeModal('about'); return; }
        if (isMobileOrTablet) { closeMobilePanels(); return; }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        openModal('searchReplace');
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'z') return;
      const target = e.target as HTMLElement;
      // Allow app-level undo/redo for lyrics line inputs (dataset.lineId);
      // other INPUT/TEXTAREA elements keep native browser undo.
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !('lineId' in target.dataset)) return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    apiErrorModal.open, confirmModal, isAboutOpen, isAnalysisModalOpen, isExportModalOpen,
    isImportModalOpen, isMobileOrTablet, isPasteModalOpen, isResetModalOpen,
    isSaveToLibraryModalOpen, isSettingsOpen, isSimilarityModalOpen, isVersionsModalOpen,
    isSearchReplaceOpen,
    promptModal, closeMobilePanels, redo,
    // dispatch refs from useModalDispatch are stable — no re-registration cost
    closeModal, openModal,
    setPromptModal, setConfirmModal,
    setIsAboutOpen, setIsAnalysisModalOpen, setIsExportModalOpen, setIsImportModalOpen,
    setIsPasteModalOpen, setIsResetModalOpen, setIsSaveToLibraryModalOpen, setIsSettingsOpen,
    setIsSimilarityModalOpen, setIsVersionsModalOpen,
    setApiErrorModal, undo,
    setIsSearchReplaceOpen,
  ]);
};

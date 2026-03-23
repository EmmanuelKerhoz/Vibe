import { useEffect } from 'react';

export type KeyboardShortcutCategory = 'edit' | 'navigation' | 'file' | 'ai';

export type KeyboardShortcutId =
  | 'undo'
  | 'redo'
  | 'dismissReset'
  | 'dismissNavigation'
  | 'dismissFileDialogs'
  | 'dismissAiDialogs';

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
] as const;

type UseKeyboardShortcutsParams = {
  promptModal: { open: boolean } | null;
  confirmModal: { open: boolean } | null;
  apiErrorModal: { open: boolean; message: string };
  isResetModalOpen: boolean;
  isVersionsModalOpen: boolean;
  isSaveToLibraryModalOpen: boolean;
  isSimilarityModalOpen: boolean;
  isAnalysisModalOpen: boolean;
  isPasteModalOpen: boolean;
  isExportModalOpen: boolean;
  isImportModalOpen: boolean;
  isSettingsOpen: boolean;
  isAboutOpen: boolean;
  isMobileOrTablet: boolean;
  closeMobilePanels: () => void;
  undo: () => void;
  redo: () => void;
  setPromptModal: (v: null) => void;
  setConfirmModal: (v: null) => void;
  setApiErrorModal: (v: { open: boolean; message: string }) => void;
  setIsResetModalOpen: (v: boolean) => void;
  setIsVersionsModalOpen: (v: boolean) => void;
  setIsSaveToLibraryModalOpen: (v: boolean) => void;
  setIsSimilarityModalOpen: (v: boolean) => void;
  setIsAnalysisModalOpen: (v: boolean) => void;
  setIsPasteModalOpen: (v: boolean) => void;
  setIsExportModalOpen: (v: boolean) => void;
  setIsImportModalOpen: (v: boolean) => void;
  setIsSettingsOpen: (v: boolean) => void;
  setIsAboutOpen: (v: boolean) => void;
};

export const useKeyboardShortcuts = ({
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
  isMobileOrTablet,
  closeMobilePanels,
  undo,
  redo,
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
}: UseKeyboardShortcutsParams) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') {
        if (promptModal?.open) { setPromptModal(null); return; }
        if (confirmModal?.open) { setConfirmModal(null); return; }
        if (apiErrorModal.open) { setApiErrorModal({ open: false, message: '' }); return; }
        if (isResetModalOpen) { setIsResetModalOpen(false); return; }
        if (isVersionsModalOpen) { setIsVersionsModalOpen(false); return; }
        if (isSaveToLibraryModalOpen) { setIsSaveToLibraryModalOpen(false); return; }
        if (isSimilarityModalOpen) { setIsSimilarityModalOpen(false); return; }
        if (isAnalysisModalOpen) { setIsAnalysisModalOpen(false); return; }
        if (isPasteModalOpen) { setIsPasteModalOpen(false); return; }
        if (isExportModalOpen) { setIsExportModalOpen(false); return; }
        if (isImportModalOpen) { setIsImportModalOpen(false); return; }
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }
        if (isAboutOpen) { setIsAboutOpen(false); return; }
        if (isMobileOrTablet) { closeMobilePanels(); return; }
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'z') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    apiErrorModal.open, confirmModal, isAboutOpen, isAnalysisModalOpen, isExportModalOpen,
    isImportModalOpen, isMobileOrTablet, isPasteModalOpen, isResetModalOpen,
    isSaveToLibraryModalOpen, isSettingsOpen, isSimilarityModalOpen, isVersionsModalOpen,
    promptModal, closeMobilePanels, redo, setApiErrorModal, setConfirmModal,
    setIsAboutOpen, setIsAnalysisModalOpen, setIsExportModalOpen, setIsImportModalOpen,
    setIsPasteModalOpen, setIsResetModalOpen, setIsSaveToLibraryModalOpen, setIsSettingsOpen,
    setIsSimilarityModalOpen, setIsVersionsModalOpen, setPromptModal, undo,
  ]);
};

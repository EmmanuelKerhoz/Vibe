import React, { createContext, useContext, useCallback, type ReactNode } from 'react';

// ── Minimal UIState interface ─────────────────────────────────────────────────
// Avoids the circular import of useUIState while remaining fully type-safe.
export interface UIStateBag {
  setIsAboutOpen: (v: boolean) => void;
  setIsSettingsOpen: (v: boolean) => void;
  setApiErrorModal: (v: { open: boolean; message: string }) => void;
  setIsImportModalOpen: (v: boolean) => void;
  setIsExportModalOpen: (v: boolean) => void;
  setIsSectionDropdownOpen: (v: boolean) => void;
  setIsSimilarityModalOpen: (v: boolean) => void;
  setIsSaveToLibraryModalOpen: (v: boolean) => void;
  setIsVersionsModalOpen: (v: boolean) => void;
  setIsResetModalOpen: (v: boolean) => void;
  setIsKeyboardShortcutsModalOpen: (v: boolean) => void;
  setConfirmModal: (v: { open: boolean; onConfirm: () => void } | null) => void;
  setPromptModal: (v: { open: boolean; onConfirm: (value: string) => void } | null) => void;
  setIsPasteModalOpen: (v: boolean) => void;
  setIsAnalysisModalOpen: (v: boolean) => void;
  setIsMarkupMode: (v: boolean) => void;
  isAboutOpen: boolean;
  isSettingsOpen: boolean;
  apiErrorModal: { open: boolean; message: string };
  isImportModalOpen: boolean;
  isExportModalOpen: boolean;
  isSectionDropdownOpen: boolean;
  isSimilarityModalOpen: boolean;
  isSaveToLibraryModalOpen: boolean;
  isVersionsModalOpen: boolean;
  isResetModalOpen: boolean;
  isKeyboardShortcutsModalOpen: boolean;
  confirmModal: { open: boolean; onConfirm: () => void } | null;
  promptModal: { open: boolean; onConfirm: (value: string) => void } | null;
  isPasteModalOpen: boolean;
  isAnalysisModalOpen: boolean;
  activeTab: 'lyrics' | 'musical';
  setActiveTab: (v: 'lyrics' | 'musical') => void;
  isStructureOpen: boolean;
  setIsStructureOpen: (v: boolean) => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (v: boolean) => void;
  isMarkupMode: boolean;
  markupText: string;
  setMarkupText: (v: string) => void;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  shouldAutoGenerateTitle: boolean;
  setShouldAutoGenerateTitle: (v: boolean) => void;
}

// ── Modal names union ─────────────────────────────────────────────────────────
export type ModalName =
  | 'about' | 'settings' | 'apiError' | 'import' | 'export'
  | 'sectionDropdown' | 'similarity' | 'saveToLibrary'
  | 'versions' | 'reset' | 'keyboardShortcuts' | 'confirm' | 'prompt' | 'paste' | 'analysis';

// ── Context value type ────────────────────────────────────────────────────────
export interface ModalContextValue {
  openModal: (name: ModalName, payload?: unknown) => void;
  closeModal: (name: ModalName) => void;
  uiState: UIStateBag;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
// uiState is injected by AppInner (the single instance from useAppState).
// No internal useUIState() — pure relay, zero split-brain.
export interface ModalProviderProps {
  children: ReactNode;
  uiState: UIStateBag;
}

export function ModalProvider({ children, uiState }: ModalProviderProps) {
  const openModal = useCallback((name: ModalName, payload?: unknown) => {
    switch (name) {
      case 'about':           uiState.setIsAboutOpen(true); break;
      case 'settings':        uiState.setIsSettingsOpen(true); break;
      case 'import':          uiState.setIsImportModalOpen(true); break;
      case 'export':          uiState.setIsExportModalOpen(true); break;
      case 'sectionDropdown': uiState.setIsSectionDropdownOpen(true); break;
      case 'similarity':      uiState.setIsSimilarityModalOpen(true); break;
      case 'saveToLibrary':   uiState.setIsSaveToLibraryModalOpen(true); break;
      case 'versions':        uiState.setIsVersionsModalOpen(true); break;
      case 'reset':           uiState.setIsResetModalOpen(true); break;
      case 'keyboardShortcuts': uiState.setIsKeyboardShortcutsModalOpen(true); break;
      case 'paste':           uiState.setIsPasteModalOpen(true); break;
      case 'analysis':        uiState.setIsAnalysisModalOpen(true); break;
      case 'apiError': {
        const msg = typeof payload === 'string' ? payload : '';
        uiState.setApiErrorModal({ open: true, message: msg });
        break;
      }
      case 'confirm': {
        const p = payload as { onConfirm: () => void };
        uiState.setConfirmModal({ open: true, onConfirm: p.onConfirm });
        break;
      }
      case 'prompt': {
        const p = payload as { onConfirm: (v: string) => void };
        uiState.setPromptModal({ open: true, onConfirm: p.onConfirm });
        break;
      }
    }
  }, [uiState]);

  const closeModal = useCallback((name: ModalName) => {
    switch (name) {
      case 'about':           uiState.setIsAboutOpen(false); break;
      case 'settings':        uiState.setIsSettingsOpen(false); break;
      case 'import':          uiState.setIsImportModalOpen(false); break;
      case 'export':          uiState.setIsExportModalOpen(false); break;
      case 'sectionDropdown': uiState.setIsSectionDropdownOpen(false); break;
      case 'similarity':      uiState.setIsSimilarityModalOpen(false); break;
      case 'saveToLibrary':   uiState.setIsSaveToLibraryModalOpen(false); break;
      case 'versions':        uiState.setIsVersionsModalOpen(false); break;
      case 'reset':           uiState.setIsResetModalOpen(false); break;
      case 'keyboardShortcuts': uiState.setIsKeyboardShortcutsModalOpen(false); break;
      case 'paste':           uiState.setIsPasteModalOpen(false); break;
      case 'analysis':        uiState.setIsAnalysisModalOpen(false); break;
      case 'apiError':        uiState.setApiErrorModal({ open: false, message: '' }); break;
      case 'confirm':         uiState.setConfirmModal(null); break;
      case 'prompt':          uiState.setPromptModal(null); break;
    }
  }, [uiState]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, uiState }}>
      {children}
    </ModalContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useModalContext(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModalContext must be used inside <ModalProvider>');
  return ctx;
}

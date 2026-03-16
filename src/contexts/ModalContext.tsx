import React, { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { useUIState } from '../hooks/useUIState';

// ── Modal names union ──────────────────────────────────────────────────────────────────
export type ModalName =
  | 'about'
  | 'settings'
  | 'apiError'
  | 'import'
  | 'export'
  | 'sectionDropdown'
  | 'similarity'
  | 'saveToLibrary'
  | 'versions'
  | 'reset'
  | 'confirm'
  | 'prompt'
  | 'paste'
  | 'analysis';

// ── Context value type ────────────────────────────────────────────────────────────────
export interface ModalContextValue {
  openModal: (name: ModalName, payload?: unknown) => void;
  closeModal: (name: ModalName) => void;
  uiState: ReturnType<typeof useUIState>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: uiState is injected by App.tsx — NOT created here.
// Previously, ModalProvider created its own useUIState() instance, causing
// a split-brain: App.tsx setters wrote to one instance, AppModals read from
// another → modals never opened. The provider is now a pure relay.
export interface ModalProviderProps {
  children: ReactNode;
  uiState: ReturnType<typeof useUIState>;
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
      case 'paste':    break;
      case 'analysis': break;
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
      case 'apiError':        uiState.setApiErrorModal({ open: false, message: '' }); break;
      case 'confirm':         uiState.setConfirmModal(null); break;
      case 'prompt':          uiState.setPromptModal(null); break;
      case 'paste':           break;
      case 'analysis':        break;
    }
  }, [uiState]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, uiState }}>
      {children}
    </ModalContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────────────
export function useModalContext(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModalContext must be used inside <ModalProvider>');
  return ctx;
}

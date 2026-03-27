import React, { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import type { EditMode } from '../types';

// ── Minimal UIState interface ─────────────────────────────────────────────────
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
  setIsSearchReplaceOpen: (v: boolean) => void;
  setEditMode: (v: EditMode) => void;
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
  isSearchReplaceOpen: boolean;
  activeTab: 'lyrics' | 'musical';
  setActiveTab: (v: 'lyrics' | 'musical') => void;
  isStructureOpen: boolean;
  setIsStructureOpen: (v: boolean) => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (v: boolean) => void;
  editMode: EditMode;
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
  | 'versions' | 'reset' | 'keyboardShortcuts' | 'confirm' | 'prompt' | 'paste' | 'analysis'
  | 'searchReplace';

// ── Dispatch context (stable — never triggers re-renders on state changes) ────
export interface ModalDispatchContextValue {
  openModal: (name: ModalName, payload?: unknown) => void;
  closeModal: (name: ModalName) => void;
}

// ── State context (full UIStateBag — subscribe only when state is needed) ─────
export interface ModalStateContextValue {
  uiState: UIStateBag;
}

// ── Legacy unified type — kept for backward compat with existing consumers ────
// Consumers should migrate to useModalDispatch() or useModalState() for
// fine-grained subscriptions. useModalContext() remains available.
export interface ModalContextValue extends ModalDispatchContextValue {
  uiState: UIStateBag;
}

const ModalDispatchContext = createContext<ModalDispatchContextValue | null>(null);
const ModalStateContext = createContext<ModalStateContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
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
      case 'searchReplace':   uiState.setIsSearchReplaceOpen(true); break;
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
      case 'searchReplace':   uiState.setIsSearchReplaceOpen(false); break;
      case 'apiError':        uiState.setApiErrorModal({ open: false, message: '' }); break;
      case 'confirm':         uiState.setConfirmModal(null); break;
      case 'prompt':          uiState.setPromptModal(null); break;
    }
  }, [uiState]);

  // Dispatch value is stable as long as uiState setters are stable (they are:
  // all setters from useState are referentially stable across renders).
  const dispatchValue = useMemo(
    () => ({ openModal, closeModal }),
    [openModal, closeModal],
  );

  // State value re-creates when uiState changes — only ModalStateContext
  // consumers re-render, not dispatch-only consumers.
  const stateValue = useMemo(
    () => ({ uiState }),
    [uiState],
  );

  return (
    <ModalDispatchContext.Provider value={dispatchValue}>
      <ModalStateContext.Provider value={stateValue}>
        {children}
      </ModalStateContext.Provider>
    </ModalDispatchContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Returns only { openModal, closeModal }.
 * Stable reference — never triggers re-renders when modal state changes.
 * Prefer this hook in action-only components (buttons, menu items, shortcuts).
 */
export function useModalDispatch(): ModalDispatchContextValue {
  const ctx = useContext(ModalDispatchContext);
  if (!ctx) throw new Error('useModalDispatch must be used inside <ModalProvider>');
  return ctx;
}

/**
 * Returns the full uiState bag.
 * Re-renders on every modal state change — use only in components that
 * actually read modal open/close state (e.g. the modal components themselves).
 */
export function useModalState(): ModalStateContextValue {
  const ctx = useContext(ModalStateContext);
  if (!ctx) throw new Error('useModalState must be used inside <ModalProvider>');
  return ctx;
}

/**
 * Backward-compatible hook — returns { openModal, closeModal, uiState }.
 * Subscribes to both contexts; re-renders on state changes.
 * Existing consumers continue to work without modification.
 * @deprecated Migrate to useModalDispatch() or useModalState() for
 * fine-grained subscriptions.
 */
export function useModalContext(): ModalContextValue {
  const dispatch = useModalDispatch();
  const { uiState } = useModalState();
  return { ...dispatch, uiState };
}

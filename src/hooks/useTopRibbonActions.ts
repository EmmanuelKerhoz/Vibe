/**
 * useTopRibbonActions
 *
 * Aggregates all stable action callbacks consumed by TopRibbon.
 * Replaces 9 individual modal-callback props that were previously drilled
 * from AppEditorLayout → TopRibbon.
 *
 * Consumers of TopRibbon no longer need to pass:
 *   setIsVersionsModalOpen, setIsResetModalOpen, onImportClick,
 *   onExportClick, onOpenLibraryClick, onOpenSettingsClick, onOpenAboutClick,
 *   onOpenKeyboardShortcutsClick, onPasteLyrics / canPasteLyrics (paste modal)
 *
 * These are now sourced directly from ModalContext (openModal) and
 * AnalysisContext (canPasteLyrics, isAnalyzing).
 */
import { useCallback } from 'react';
import { useModalDispatch, useModalState } from '../contexts/ModalContext';
import { useAnalysisContext } from '../contexts/AnalysisContext';

export interface TopRibbonActions {
  openVersionsModal: () => void;
  openResetModal: () => void;
  openImport: () => void;
  openExport: () => void;
  openLibrary: () => void;
  openSettings: () => void;
  openAbout: () => void;
  openKeyboardShortcuts: () => void;
  openPasteModal: () => void;
  canPasteLyrics: boolean;
  isAnalyzing: boolean;
}

export function useTopRibbonActions(): TopRibbonActions {
  const { openModal } = useModalDispatch();
  const { uiState } = useModalState();
  const { canPasteLyrics, isAnalyzing } = useAnalysisContext();

  const openVersionsModal     = useCallback(() => openModal('versions'),          [openModal]);
  const openResetModal        = useCallback(() => openModal('reset'),             [openModal]);
  const openImport            = useCallback(() => uiState.importInputRef.current?.click(), [uiState.importInputRef]);
  const openExport            = useCallback(() => openModal('export'),            [openModal]);
  const openLibrary           = useCallback(() => openModal('saveToLibrary'),     [openModal]);
  const openSettings          = useCallback(() => openModal('settings'),          [openModal]);
  const openAbout             = useCallback(() => openModal('about'),             [openModal]);
  const openKeyboardShortcuts = useCallback(() => openModal('keyboardShortcuts'), [openModal]);
  const openPasteModal        = useCallback(() => openModal('paste'),             [openModal]);

  return {
    openVersionsModal,
    openResetModal,
    openImport,
    openExport,
    openLibrary,
    openSettings,
    openAbout,
    openKeyboardShortcuts,
    openPasteModal,
    canPasteLyrics,
    isAnalyzing,
  };
}

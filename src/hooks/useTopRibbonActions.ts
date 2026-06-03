/**
 * useTopRibbonActions
 *
 * Aggregates all stable action callbacks consumed by TopRibbon.
 *
 * Import/Export cloud actions use explicit provider suffixes:
 *   openImportLocal     — file input click (existing behaviour)
 *   openImportOneDrive  — cloudStorage picker (mode:'lyrics', provider: onedrive)
 *   openImportGDrive    — cloudStorage picker (mode:'lyrics', provider: gdrive)
 *   openExportLocal     — ExportModal (download to device)
 *   openExportOneDrive  — save to OneDrive via Graph PUT
 *   openExportGDrive    — save to Google Drive
 *
 * openCloudStoragePlayer / openCloudStoragePlayerFiles are kept for the
 * Player tab which still uses them directly.
 */
import { useCallback } from 'react';
import { useModalDispatch, useModalState } from '../contexts/ModalContext';
import { useAnalysisContext } from '../contexts/AnalysisContext';

export interface TopRibbonActions {
  openVersionsModal: () => void;
  openResetModal: () => void;
  /** @deprecated use openImportLocal */
  openImport: () => void;
  openImportLocal: () => void;
  openImportOneDrive: () => void;
  openImportGDrive: () => void;
  /** @deprecated use openExportLocal */
  openExport: () => void;
  openExportLocal: () => void;
  openExportOneDrive: () => void;
  openExportGDrive: () => void;
  openLibrary: () => void;
  openSettings: () => void;
  openAbout: () => void;
  openKeyboardShortcuts: () => void;
  openPasteModal: () => void;
  /** mode:'lyrics' — ouvre le picker cloud pour sélectionner un fichier de paroles */
  openCloudStorageLyrics: () => void;
  /** mode:'player' — ouvre le picker cloud pour sélectionner un dossier audio (Player) */
  openCloudStoragePlayer: () => void;
  /** mode:'player-files' — ouvre le picker cloud multi-sélection fichiers audio (Player) */
  openCloudStoragePlayerFiles: () => void;
  canPasteLyrics: boolean;
  isAnalyzing: boolean;
}

export function useTopRibbonActions(): TopRibbonActions {
  const { openModal } = useModalDispatch();
  const { uiState } = useModalState();
  const { canPasteLyrics, isAnalyzing } = useAnalysisContext();

  const openVersionsModal           = useCallback(() => openModal('versions'),                                  [openModal]);
  const openResetModal              = useCallback(() => openModal('reset'),                                     [openModal]);
  const openImportLocal             = useCallback(() => uiState.importInputRef.current?.click(),                [uiState.importInputRef]);
  const openImportOneDrive          = useCallback(() => openModal('cloudStorage', { mode: 'lyrics', provider: 'onedrive' }),  [openModal]);
  const openImportGDrive            = useCallback(() => openModal('cloudStorage', { mode: 'lyrics', provider: 'gdrive' }),    [openModal]);
  const openExportLocal             = useCallback(() => openModal('export'),                                    [openModal]);
  const openExportOneDrive          = useCallback(() => openModal('cloudSave', { provider: 'onedrive' }),       [openModal]);
  const openExportGDrive            = useCallback(() => openModal('cloudSave', { provider: 'gdrive' }),         [openModal]);
  const openLibrary                 = useCallback(() => openModal('saveToLibrary'),                            [openModal]);
  const openSettings                = useCallback(() => openModal('settings'),                                 [openModal]);
  const openAbout                   = useCallback(() => openModal('about'),                                    [openModal]);
  const openKeyboardShortcuts       = useCallback(() => openModal('keyboardShortcuts'),                        [openModal]);
  const openPasteModal              = useCallback(() => openModal('paste'),                                    [openModal]);
  const openCloudStorageLyrics      = useCallback(() => openModal('cloudStorage', { mode: 'lyrics' }),         [openModal]);
  const openCloudStoragePlayer      = useCallback(() => openModal('cloudStorage', { mode: 'player' }),         [openModal]);
  const openCloudStoragePlayerFiles = useCallback(() => openModal('cloudStorage', { mode: 'player-files' }),   [openModal]);

  return {
    openVersionsModal,
    openResetModal,
    // backward-compat aliases
    openImport: openImportLocal,
    openImportLocal,
    openImportOneDrive,
    openImportGDrive,
    openExport: openExportLocal,
    openExportLocal,
    openExportOneDrive,
    openExportGDrive,
    openLibrary,
    openSettings,
    openAbout,
    openKeyboardShortcuts,
    openPasteModal,
    openCloudStorageLyrics,
    openCloudStoragePlayer,
    openCloudStoragePlayerFiles,
    canPasteLyrics,
    isAnalyzing,
  };
}

import React from 'react';
import { AboutModal } from './modals/AboutModal';
import { SettingsModal } from './modals/SettingsModal';
import { ImportModal } from './modals/ImportModal';
import { ExportModal } from './modals/ExportModal';
import { PasteModal } from './modals/PasteModal';
import { AnalysisModal } from './modals/AnalysisModal';
import { SimilarityModal } from './modals/SimilarityModal';
import { SaveToLibraryModal } from './modals/SaveToLibraryModal';
import { VersionsModal } from './modals/VersionsModal';
import { ResetModal } from './modals/ResetModal';
import { KeyboardShortcutsModal } from './modals/KeyboardShortcutsModal';
import { ApiErrorModal } from './modals/ApiErrorModal';
import { ConfirmModal } from './modals/ConfirmModal';
import { PromptModal } from './modals/PromptModal';
import { SearchReplaceModal } from './modals/SearchReplaceModal';
import { useModalContext } from '../../contexts/ModalContext';
import type { LibraryAsset } from '../../utils/libraryUtils';
import type { SimilarityMatch } from '../../utils/similarityUtils';
import type { SongVersion } from '../../types';
import type { WebSimilarityIndex } from '../../types/webSimilarity';
import type { ExportFormat } from '../../utils/exportUtils';
import type { VersionSnapshot } from '../../utils/songDefaults';
import { useTranslation } from '../../i18n';

/**
 * Business-only props — no modal open/close state.
 * All UI state is read from ModalContext.
 */
interface Props {
  // Theme / audio (still needed by SettingsModal)
  theme: 'light' | 'dark';
  setTheme: (v: 'light' | 'dark') => void;
  audioFeedback: boolean;
  setAudioFeedback: (v: boolean) => void;
  uiScale: 'small' | 'medium' | 'large';
  setUiScale: (v: 'small' | 'medium' | 'large') => void;
  defaultEditMode: 'text' | 'section' | 'markdown' | 'phonetic';
  setDefaultEditMode: (v: 'text' | 'section' | 'markdown' | 'phonetic') => void;
  showTranslationFeatures: boolean;
  setShowTranslationFeatures: (v: boolean) => void;

  // Import
  hasExistingWork: boolean;
  handleImportChooseFile: () => void;
  onOpenPasteLyrics: () => void;
  handleImportInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Export
  exportSong: (format: ExportFormat) => Promise<void>;

  // Paste / analysis (data props only)
  pastedText: string;
  setPastedText: (v: string) => void;
  isAnalyzing: boolean;
  importProgress: {
    current: number;
    total: number;
    currentLabel: string;
  };
  analyzePastedLyrics: () => void;
  analysisReport: {
    theme: string;
    emotionalArc: string;
    technicalAnalysis: string[];
    strengths: string[];
    improvements: string[];
    musicalSuggestions: string[];
    summary: string;
  } | null;
  analysisSteps: string[];
  appliedAnalysisItems: Set<string>;
  selectedAnalysisItems: Set<string>;
  isApplyingAnalysis: string | null;
  toggleAnalysisItemSelection: (id: string) => void;
  applySelectedAnalysisItems: () => void;
  clearAppliedAnalysisItems: () => void;

  // Versions
  versions: SongVersion[];
  rollbackToVersion: (version: SongVersion) => void;
  saveVersion: (name: string, snapshot?: VersionSnapshot) => void;
  handleRequestVersionName: (callback: (name: string) => void) => void;

  // Similarity
  similarityMatches: SimilarityMatch[];
  libraryCount: number;
  webSimilarityIndex: WebSimilarityIndex;
  triggerWebSimilarity: () => void;
  handleDeleteLibraryAsset: (id: string) => void;

  // Library
  handleSaveToLibrary: () => Promise<void>;
  handleLoadLibraryAsset: (asset: LibraryAsset) => void;
  handlePurgeLibrary: () => Promise<void>;
  isSavingToLibrary: boolean;
  title: string;
  libraryAssets: LibraryAsset[];
  hasCurrentSong: boolean;

  // Reset
  resetSong: () => void;
}

export const AppModals = React.memo(function AppModals({
  theme, setTheme, audioFeedback, setAudioFeedback, uiScale, setUiScale, defaultEditMode, setDefaultEditMode,
  showTranslationFeatures, setShowTranslationFeatures,
  hasExistingWork, handleImportChooseFile, onOpenPasteLyrics, handleImportInputChange,
  exportSong,
  pastedText, setPastedText, isAnalyzing, importProgress, analyzePastedLyrics,
  analysisReport, analysisSteps,
  appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis,
  toggleAnalysisItemSelection, applySelectedAnalysisItems, clearAppliedAnalysisItems,
  versions, rollbackToVersion, saveVersion, handleRequestVersionName,
  similarityMatches, libraryCount, webSimilarityIndex, triggerWebSimilarity, handleDeleteLibraryAsset,
  handleSaveToLibrary, handleLoadLibraryAsset, handlePurgeLibrary, isSavingToLibrary, title, libraryAssets, hasCurrentSong,
  resetSong,
}: Props) {
  const { t } = useTranslation();
  const { uiState: ui, closeModal, openModal } = useModalContext();
  const { importInputRef } = ui;
  const openLibraryFromImport = () => {
    closeModal('import');
    openModal('saveToLibrary');
  };
  const openLibraryFromExport = () => {
    closeModal('export');
    openModal('saveToLibrary');
  };

  return (
    <>
      <AboutModal isOpen={ui.isAboutOpen} onClose={() => closeModal('about')} />
      <SettingsModal
        isOpen={ui.isSettingsOpen} onClose={() => closeModal('settings')}
        theme={theme} setTheme={setTheme}
        audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback}
        uiScale={uiScale} setUiScale={setUiScale}
        defaultEditMode={defaultEditMode} setDefaultEditMode={setDefaultEditMode}
        showTranslationFeatures={showTranslationFeatures} setShowTranslationFeatures={setShowTranslationFeatures}
      />
      <ImportModal
        isOpen={ui.isImportModalOpen} hasExistingWork={hasExistingWork}
        onClose={() => closeModal('import')} onChooseFile={handleImportChooseFile}
        onOpenLibrary={openLibraryFromImport}
        onPasteLyrics={onOpenPasteLyrics}
      />
      <ExportModal
        isOpen={ui.isExportModalOpen}
        onClose={() => closeModal('export')}
        onOpenLibrary={openLibraryFromExport}
        onExport={exportSong}
      />
      <PasteModal
        isOpen={ui.isPasteModalOpen} onClose={() => closeModal('paste')}
        pastedText={pastedText} setPastedText={setPastedText}
        isAnalyzing={isAnalyzing} importProgress={importProgress} onAnalyze={analyzePastedLyrics}
      />
      <AnalysisModal
        isOpen={ui.isAnalysisModalOpen} onClose={() => closeModal('analysis')}
        isAnalyzing={isAnalyzing} analysisReport={analysisReport} analysisSteps={analysisSteps}
        appliedAnalysisItems={appliedAnalysisItems} selectedAnalysisItems={selectedAnalysisItems}
        isApplyingAnalysis={isApplyingAnalysis}
        toggleAnalysisItemSelection={toggleAnalysisItemSelection}
        applySelectedAnalysisItems={applySelectedAnalysisItems}
        clearAppliedAnalysisItems={clearAppliedAnalysisItems}
        versions={versions} rollbackToVersion={rollbackToVersion}
      />
      <SimilarityModal
        isOpen={ui.isSimilarityModalOpen} onClose={() => closeModal('similarity')}
        matches={similarityMatches} candidateCount={libraryCount}
        webIndex={webSimilarityIndex} onWebRefresh={triggerWebSimilarity}
        onDeleteLibraryAsset={handleDeleteLibraryAsset}
      />
      <SaveToLibraryModal
        isOpen={ui.isSaveToLibraryModalOpen} onClose={() => closeModal('saveToLibrary')}
        onSave={handleSaveToLibrary} onLoadAsset={handleLoadLibraryAsset}
        onDeleteAsset={handleDeleteLibraryAsset} onPurgeLibrary={handlePurgeLibrary}
        isSaving={isSavingToLibrary}
        currentTitle={title} libraryAssets={libraryAssets} hasCurrentSong={hasCurrentSong}
      />
      <VersionsModal
        isOpen={ui.isVersionsModalOpen} versions={versions}
        onClose={() => closeModal('versions')} onSaveCurrent={saveVersion}
        onRollback={rollbackToVersion} onRequestVersionName={handleRequestVersionName}
      />
      <ResetModal isOpen={ui.isResetModalOpen} onClose={() => closeModal('reset')} onConfirm={resetSong} />
      <KeyboardShortcutsModal
        isOpen={ui.isKeyboardShortcutsModalOpen}
        onClose={() => closeModal('keyboardShortcuts')}
      />
      <SearchReplaceModal
        isOpen={ui.isSearchReplaceOpen}
        onClose={() => closeModal('searchReplace')}
      />
      <ApiErrorModal
        isOpen={ui.apiErrorModal.open} onClose={() => closeModal('apiError')}
        message={ui.apiErrorModal.message}
      />
      {ui.confirmModal && (
        <ConfirmModal
          isOpen={ui.confirmModal.open}
          title="Regenerate Song" message={t.editor.regenerateWarning}
          confirmLabel="Regenerate" cancelLabel="Cancel"
          onConfirm={ui.confirmModal.onConfirm} onCancel={() => closeModal('confirm')}
        />
      )}
      {ui.promptModal && (
        <PromptModal
          isOpen={ui.promptModal.open}
          title="Save Version" message="Enter a name for this version:"
          placeholder="Version name" confirmLabel="Save" cancelLabel="Cancel"
          onConfirm={ui.promptModal.onConfirm} onCancel={() => closeModal('prompt')}
        />
      )}
      <input
        ref={importInputRef} type="file" accept=".txt,.md,.json,.docx,.odt"
        className="hidden" onChange={handleImportInputChange}
      />
    </>
  );
});

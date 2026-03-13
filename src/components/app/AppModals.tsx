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
import { ApiErrorModal } from './modals/ApiErrorModal';
import { ConfirmModal } from './modals/ConfirmModal';
import { PromptModal } from './modals/PromptModal';
import { SuggestionsPanel } from './SuggestionsPanel';
import type { LibraryAsset } from '../../utils/libraryUtils';
import type { SimilarityMatch } from '../../utils/similarityUtils';
import type { SongVersion } from '../../types';
import type { WebSimilarityIndex } from '../../types/webSimilarity';
import type { ExportFormat } from '../../utils/exportUtils';
import type { VersionSnapshot } from '../../utils/songDefaults';
import { useTranslation } from '../../i18n';

interface Props {
  isAboutOpen: boolean;
  setIsAboutOpen: (v: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (v: 'light' | 'dark') => void;
  audioFeedback: boolean;
  setAudioFeedback: (v: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (v: boolean) => void;
  hasExistingWork: boolean;
  handleImportChooseFile: () => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (v: boolean) => void;
  exportSong: (format: ExportFormat) => Promise<void>;
  selectedLineId: string | null;
  setSelectedLineId: (v: string | null) => void;
  suggestions: string[];
  isSuggesting: boolean;
  applySuggestion: (s: string) => void;
  generateSuggestions: (lineId: string) => void;
  isPasteModalOpen: boolean;
  setIsPasteModalOpen: (v: boolean) => void;
  pastedText: string;
  setPastedText: (v: string) => void;
  isAnalyzing: boolean;
  analyzePastedLyrics: () => void;
  isAnalysisModalOpen: boolean;
  setIsAnalysisModalOpen: (v: boolean) => void;
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
  versions: SongVersion[];
  rollbackToVersion: (version: SongVersion) => void;
  isSimilarityModalOpen: boolean;
  setIsSimilarityModalOpen: (v: boolean) => void;
  similarityMatches: SimilarityMatch[];
  libraryCount: number;
  webSimilarityIndex: WebSimilarityIndex;
  triggerWebSimilarity: () => void;
  handleDeleteLibraryAsset: (id: string) => void;
  isSaveToLibraryModalOpen: boolean;
  setIsSaveToLibraryModalOpen: (v: boolean) => void;
  handleSaveToLibrary: () => Promise<void>;
  handleLoadLibraryAsset: (asset: LibraryAsset) => void;
  isSavingToLibrary: boolean;
  title: string;
  libraryAssets: LibraryAsset[];
  isVersionsModalOpen: boolean;
  setIsVersionsModalOpen: (v: boolean) => void;
  saveVersion: (name: string, snapshot?: VersionSnapshot) => void;
  handleRequestVersionName: (callback: (name: string) => void) => void;
  isResetModalOpen: boolean;
  setIsResetModalOpen: (v: boolean) => void;
  resetSong: () => void;
  apiErrorModal: { open: boolean; message: string };
  setApiErrorModal: (v: { open: boolean; message: string }) => void;
  confirmModal: { open: boolean; onConfirm: () => void } | null;
  setConfirmModal: (v: { open: boolean; onConfirm: () => void } | null) => void;
  promptModal: { open: boolean; onConfirm: (v: string) => void } | null;
  setPromptModal: (v: { open: boolean; onConfirm: (v: string) => void } | null) => void;
}

export function AppModals({
  isAboutOpen, setIsAboutOpen,
  isSettingsOpen, setIsSettingsOpen, theme, setTheme, audioFeedback, setAudioFeedback,
  isImportModalOpen, setIsImportModalOpen, hasExistingWork, handleImportChooseFile,
  importInputRef, handleImportInputChange,
  isExportModalOpen, setIsExportModalOpen, exportSong,
  selectedLineId, setSelectedLineId, suggestions, isSuggesting, applySuggestion, generateSuggestions,
  isPasteModalOpen, setIsPasteModalOpen, pastedText, setPastedText, isAnalyzing, analyzePastedLyrics,
  isAnalysisModalOpen, setIsAnalysisModalOpen, analysisReport, analysisSteps,
  appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis,
  toggleAnalysisItemSelection, applySelectedAnalysisItems, clearAppliedAnalysisItems,
  versions, rollbackToVersion,
  isSimilarityModalOpen, setIsSimilarityModalOpen, similarityMatches, libraryCount,
  webSimilarityIndex, triggerWebSimilarity, handleDeleteLibraryAsset,
  isSaveToLibraryModalOpen, setIsSaveToLibraryModalOpen, handleSaveToLibrary,
  handleLoadLibraryAsset, isSavingToLibrary, title, libraryAssets,
  isVersionsModalOpen, setIsVersionsModalOpen, saveVersion, handleRequestVersionName,
  isResetModalOpen, setIsResetModalOpen, resetSong,
  apiErrorModal, setApiErrorModal,
  confirmModal, setConfirmModal,
  promptModal, setPromptModal,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} setTheme={setTheme} audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback} />
      <ImportModal isOpen={isImportModalOpen} hasExistingWork={hasExistingWork} onClose={() => setIsImportModalOpen(false)} onChooseFile={handleImportChooseFile} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={exportSong} />
      <SuggestionsPanel selectedLineId={selectedLineId} setSelectedLineId={setSelectedLineId} suggestions={suggestions} isSuggesting={isSuggesting} applySuggestion={applySuggestion} generateSuggestions={generateSuggestions} />
      <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} pastedText={pastedText} setPastedText={setPastedText} isAnalyzing={isAnalyzing} onAnalyze={analyzePastedLyrics} />
      <AnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} isAnalyzing={isAnalyzing} analysisReport={analysisReport} analysisSteps={analysisSteps} appliedAnalysisItems={appliedAnalysisItems} selectedAnalysisItems={selectedAnalysisItems} isApplyingAnalysis={isApplyingAnalysis} toggleAnalysisItemSelection={toggleAnalysisItemSelection} applySelectedAnalysisItems={applySelectedAnalysisItems} clearAppliedAnalysisItems={clearAppliedAnalysisItems} versions={versions} rollbackToVersion={rollbackToVersion} />
      <SimilarityModal isOpen={isSimilarityModalOpen} onClose={() => setIsSimilarityModalOpen(false)} matches={similarityMatches} candidateCount={libraryCount} webIndex={webSimilarityIndex} onWebRefresh={triggerWebSimilarity} onDeleteLibraryAsset={handleDeleteLibraryAsset} />
      <SaveToLibraryModal isOpen={isSaveToLibraryModalOpen} onClose={() => setIsSaveToLibraryModalOpen(false)} onSave={handleSaveToLibrary} onLoadAsset={handleLoadLibraryAsset} onDeleteAsset={handleDeleteLibraryAsset} isSaving={isSavingToLibrary} currentTitle={title} libraryAssets={libraryAssets} />
      <VersionsModal isOpen={isVersionsModalOpen} versions={versions} onClose={() => setIsVersionsModalOpen(false)} onSaveCurrent={saveVersion} onRollback={rollbackToVersion} onRequestVersionName={handleRequestVersionName} />
      <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={resetSong} />
      <ApiErrorModal isOpen={apiErrorModal.open} onClose={() => setApiErrorModal({ open: false, message: '' })} message={apiErrorModal.message} />
      {confirmModal && <ConfirmModal isOpen={confirmModal.open} title="Regenerate Song" message={t.editor.regenerateWarning} confirmLabel="Regenerate" cancelLabel="Cancel" onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
      {promptModal && <PromptModal isOpen={promptModal.open} title="Save Version" message="Enter a name for this version:" placeholder="Version name" confirmLabel="Save" cancelLabel="Cancel" onConfirm={promptModal.onConfirm} onCancel={() => setPromptModal(null)} />}
      <input ref={importInputRef} type="file" accept=".txt,.md,.json,.docx,.odt" className="hidden" onChange={handleImportInputChange} />
    </>
  );
}

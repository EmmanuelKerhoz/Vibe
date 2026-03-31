/**
 * AppModalLayer
 * Consumes all required contexts directly — zero props from AppInnerContent.
 * Lazy-loads AppModals (already code-split). Owns the ErrorBoundary + Suspense
 * wrapper that was previously inlined in AppInnerContent.
 */
import React, { Suspense, lazy } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ErrorBoundary } from './ErrorBoundary';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useAppStateContext } from '../../contexts/AppStateContext';
import { useVersionContext } from '../../contexts/VersionContext';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { useSimilarityContext } from '../../contexts/SimilarityContext';
import { useDerivedAppState } from '../../hooks/useDerivedAppState';
import { useImportHandlers } from '../../hooks/useImportHandlers';
import { useLibraryActions } from '../../hooks/useLibraryActions';
import { useModalHandlers } from '../../hooks/useModalHandlers';
import { useSessionActions } from '../../hooks/useSessionActions';
import { useSongEditor } from '../../hooks/useSongEditor';
import { useTopicMoodSuggester } from '../../hooks/useTopicMoodSuggester';
import { useTranslation } from '../../i18n';

const AppModals = lazy(() =>
  import('./AppModals').then(m => ({ default: m.AppModals }))
);

function LazyFallback() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t.common?.loading ?? 'Loading'}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', width: '100%' }}
    >
      <Spinner size="small" />
    </div>
  );
}

export function AppModalLayer() {
  const {
    song,
    structure,
    title,
    rhymeScheme,
    replaceStateWithoutHistory,
    clearHistory,
    updateSongAndStructureWithHistory,
    setSongLanguage,
  } = useSongContext();

  const { clearSelection } = useComposerContext();

  const { appState } = useAppStateContext();
  const {
    theme, setTheme, audioFeedback, setAudioFeedback,
    uiScale, setUiScale, defaultEditMode, setDefaultEditMode,
    showTranslationFeatures, setShowTranslationFeatures,
    similarityMatches, setSimilarityMatches,
    libraryCount, setLibraryCount, libraryAssets, setLibraryAssets,
    isSavingToLibrary, setIsSavingToLibrary,
    setIsSaveToLibraryModalOpen,
    setIsImportModalOpen, setIsExportModalOpen,
    setIsSettingsOpen, setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen, setIsSearchReplaceOpen,
    setIsPasteModalOpen,
    importInputRef,
    setIsResetModalOpen,
    editMode, markupText,
    hasApiKey,
  } = appState;

  const {
    pastedText, setPastedText,
    isAnalyzing, isAnalyzingTheme, importProgress,
    analysisReport, analysisSteps,
    appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis,
    targetLanguage, setTargetLanguage,
    sectionTargetLanguages, setSectionTargetLanguages,
    toggleAnalysisItemSelection, applyAnalysisItem, applySelectedAnalysisItems,
    clearAppliedAnalysisItems, analyzePastedLyrics,
  } = useAnalysisContext();

  const { versions, saveVersion, rollbackToVersion, handleRequestVersionName } = useVersionContext();

  const { index: webSimilarityIndex, triggerNow: triggerWebSimilarity, resetIndex: resetWebSimilarityIndex } = useSimilarityContext();

  const { hasExistingWork } = useDerivedAppState({ editMode, markupText, webSimilarityIndex });

  const { resetSuggestionCycle } = useTopicMoodSuggester({ hasApiKey });

  const { exportSong, loadFileForAnalysis } = useSongEditor({
    openPasteModalWithText: (text: string) => { setPastedText(text); setIsPasteModalOpen(true); },
  });

  const { handleImportInputChange, handleImportChooseFile } = useImportHandlers({
    importInputRef,
    loadFileForAnalysis,
    setIsImportModalOpen,
    setIsPasteModalOpen,
    setPastedText,
    setSongLanguage,
  });

  const {
    handleSaveToLibrary, handleLoadLibraryAsset,
    handleDeleteLibraryAsset, handlePurgeLibrary,
  } = useLibraryActions({
    song,
    replaceStateWithoutHistory,
    clearHistory,
    setSimilarityMatches,
    setLibraryCount,
    setLibraryAssets,
    setIsSavingToLibrary,
    setIsSaveToLibraryModalOpen,
  });

  const { handleOpenPasteLyricsFromModals, handleSectionTargetLanguageChange } = useModalHandlers({
    setIsPasteModalOpen,
    setIsImportModalOpen,
    setIsExportModalOpen,
    setIsSettingsOpen,
    setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen,
    setIsSearchReplaceOpen,
    setSectionTargetLanguages,
  });

  const { resetSong } = useSessionActions({
    song,
    structure,
    rhymeScheme,
    appState,
    replaceStateWithoutHistory,
    clearHistory,
    clearSelection,
    resetWebSimilarityIndex,
    resetSuggestionCycle,
    updateSongAndStructureWithHistory,
    setIsResetModalOpen,
  });

  return (
    <ErrorBoundary>
      <Suspense fallback={<LazyFallback />}>
        <AppModals
          theme={theme} setTheme={setTheme}
          audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback}
          uiScale={uiScale} setUiScale={setUiScale}
          defaultEditMode={defaultEditMode} setDefaultEditMode={setDefaultEditMode}
          showTranslationFeatures={showTranslationFeatures} setShowTranslationFeatures={setShowTranslationFeatures}
          hasExistingWork={hasExistingWork}
          handleImportChooseFile={handleImportChooseFile}
          onOpenPasteLyrics={handleOpenPasteLyricsFromModals}
          handleImportInputChange={handleImportInputChange}
          exportSong={exportSong}
          pastedText={pastedText} setPastedText={setPastedText}
          isAnalyzing={isAnalyzing}
          isAnalyzingTheme={isAnalyzingTheme}
          importProgress={importProgress}
          analyzePastedLyrics={analyzePastedLyrics}
          analysisReport={analysisReport} analysisSteps={analysisSteps}
          appliedAnalysisItems={appliedAnalysisItems}
          selectedAnalysisItems={selectedAnalysisItems}
          isApplyingAnalysis={isApplyingAnalysis}
          toggleAnalysisItemSelection={toggleAnalysisItemSelection}
          applyAnalysisItem={applyAnalysisItem}
          applySelectedAnalysisItems={applySelectedAnalysisItems}
          clearAppliedAnalysisItems={clearAppliedAnalysisItems}
          versions={versions} rollbackToVersion={rollbackToVersion}
          similarityMatches={similarityMatches} libraryCount={libraryCount}
          webSimilarityIndex={webSimilarityIndex} triggerWebSimilarity={triggerWebSimilarity}
          handleDeleteLibraryAsset={handleDeleteLibraryAsset}
          handleSaveToLibrary={handleSaveToLibrary} isSavingToLibrary={isSavingToLibrary}
          title={title} libraryAssets={libraryAssets} hasCurrentSong={song.length > 0}
          handleLoadLibraryAsset={handleLoadLibraryAsset}
          handlePurgeLibrary={handlePurgeLibrary}
          saveVersion={saveVersion}
          handleRequestVersionName={handleRequestVersionName}
          resetSong={resetSong}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

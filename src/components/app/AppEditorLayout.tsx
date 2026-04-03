/**
 * AppEditorLayout
 * Renders the center column: LeftSettingsPanel + TopRibbon + AppEditorZone.
 * Reads what it needs from SongContext, AppStateContext, ComposerContext,
 * AnalysisContext, and SimilarityContext directly — no new props.
 */
import React, { Suspense, lazy, useCallback, useEffect } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ErrorBoundary } from './ErrorBoundary';
import { useAppStateContext } from '../../contexts/AppStateContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useSongContext } from '../../contexts/SongContext';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { useSimilarityContext } from '../../contexts/SimilarityContext';
import { useSongEditor } from '../../hooks/useSongEditor';
import { useTitleGenerator } from '../../hooks/useTitleGenerator';
import { useTopicMoodSuggester } from '../../hooks/useTopicMoodSuggester';
import { useDerivedAppState } from '../../hooks/useDerivedAppState';
import { useAppHandlers } from '../../hooks/useAppHandlers';
import { useModalHandlers } from '../../hooks/useModalHandlers';
import { useSessionActions } from '../../hooks/useSessionActions';
import { useLibraryActions } from '../../hooks/useLibraryActions';
import { useImportHandlers } from '../../hooks/useImportHandlers';
import { useLinguisticsWorker } from '../../hooks/useLinguisticsWorker';
import { useMarkupEditor } from '../../hooks/useMarkupEditor';
import { useSpellCheck } from '../../hooks/composer/useSpellCheck';
import { useTranslation } from '../../i18n';
import { AppEditorZone } from './AppEditorZone';

const LeftSettingsPanel = lazy(() =>
  import('./LeftSettingsPanel').then(m => ({ default: m.LeftSettingsPanel }))
);
const TopRibbon = lazy(() =>
  import('./TopRibbon').then(m => ({ default: m.TopRibbon }))
);
const StructureSidebar = lazy(() =>
  import('./StructureSidebar').then(m => ({ default: m.StructureSidebar }))
);
const SuggestionsPanel = lazy(() =>
  import('./SuggestionsPanel').then(m => ({ default: m.SuggestionsPanel }))
);
const AnalysisPanel = lazy(() =>
  import('./AnalysisPanel').then(m => ({ default: m.AnalysisPanel }))
);

const LazyFallback = React.memo(function LazyFallback() {
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
});

interface AppEditorLayoutProps {
  isMobileOrTablet: boolean;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
  /**
   * Passed from AppInnerContent (App.tsx) — single source of truth.
   * Clears selectedLineId whenever the structure panel is opened.
   */
  setIsStructureOpenAndClearLine: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export function AppEditorLayout({
  isMobileOrTablet,
  playAudioFeedback,
  setIsStructureOpenAndClearLine,
}: AppEditorLayoutProps) {
  const { t } = useTranslation();
  const {
    song, structure, rhymeScheme,
    title, setTitle, titleOrigin, topic, setTopic, mood, setMood,
    setRhymeScheme, targetSyllables, setTargetSyllables,
    updateSongAndStructureWithHistory, updateState, replaceStateWithoutHistory, clearHistory,
    songLanguage, setSongLanguage,
  } = useSongContext();

  const {
    selectedLineId, setSelectedLineId, suggestions, isSuggesting,
    generateSong, generateSuggestions, applySuggestion, clearSelection,
  } = useComposerContext();

  const { appState } = useAppStateContext();
  const {
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen, isLeftPanelOpen, setIsLeftPanelOpen,
    editMode, setEditMode, markupText, setMarkupText, markupTextareaRef,
    similarityMatches, setSimilarityMatches, libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets, isSavingToLibrary, setIsSavingToLibrary,
    isSectionDropdownOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen,
    setIsVersionsModalOpen, setIsResetModalOpen,
    setIsSaveToLibraryModalOpen,
    isPasteModalOpen, setIsPasteModalOpen,
    setIsImportModalOpen, setIsExportModalOpen,
    setIsSettingsOpen, setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen, setIsSearchReplaceOpen,
    isAnalysisPanelOpen, setIsAnalysisPanelOpen,
    apiErrorModal, setApiErrorModal,
    confirmModal, setConfirmModal,
    hasApiKey, importInputRef,
  } = appState;

  const {
    canPasteLyrics,
    pastedText, setPastedText,
    isAnalyzing, isAdaptingLanguage, isDetectingLanguage,
    targetLanguage, setTargetLanguage,
    sectionTargetLanguages, setSectionTargetLanguages,
    adaptSongLanguage, detectLanguage, analyzeCurrentSong,
    adaptationProgress, adaptationResult,
  } = useAnalysisContext();

  const { index: webSimilarityIndex, resetIndex: resetWebSimilarityIndex } = useSimilarityContext();

  const { switchEditMode, scrollToSection: scrollToSectionFn } = useMarkupEditor({
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    updateSongAndStructureWithHistory,
  });

  const { hasRealLyricContent, webBadgeLabel } = useDerivedAppState({
    editMode, markupText, webSimilarityIndex,
  });

  // ── Off-thread phonological analysis (Web Worker) ──────────────────────
  const linguisticsWorker = useLinguisticsWorker(song, songLanguage);

  const {
    removeStructureItem, addStructureItem, loadFileForAnalysis,
  } = useSongEditor({
    openPasteModalWithText: (text: string) => { setPastedText(text); setIsPasteModalOpen(true); },
  });

  const { generateTitle, isGeneratingTitle } = useTitleGenerator();
  const {
    generateSuggestion: handleSurprise,
    isGeneratingSuggestion: isSurprising,
    resetSuggestionCycle,
  } = useTopicMoodSuggester({ hasApiKey });

  // ── Spell-check ──────────────────────────────────────────────────────────
  const spellCheck = useSpellCheck({
    song,
    songLanguage,
    hasApiKey,
    selectedLineId,
    updateState,
  });

  // Trigger spell-check automatically when a line is selected
  useEffect(() => {
    if (selectedLineId && hasApiKey) {
      spellCheck.checkSpelling(selectedLineId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLineId, hasApiKey]);

  const handleSurpriseClick = useCallback(async () => {
    const suggestion = await handleSurprise();
    if (suggestion) {
      setTopic(suggestion.topic);
      setMood(suggestion.mood);
    }
  }, [handleSurprise, setMood, setTopic]);

  const {
    handleApiKeyHelp, handleTitleChange, handleGenerateTitle,
    handleGlobalRegenerate, handleScrollToSection, handleOpenNewGeneration,
  } = useAppHandlers({
    t, hasRealLyricContent, isMobileOrTablet,
    setApiErrorModal, setConfirmModal, setActiveTab,
    setIsLeftPanelOpen, setIsStructureOpen,
    generateTitle, generateSong, scrollToSection: scrollToSectionFn,
  });

  const {
    handleOpenPasteModal,
    handleOpenImport,
    handleOpenExport,
    handleOpenSettings,
    handleOpenAbout,
    handleOpenKeyboardShortcuts,
    handleOpenSearch,
    handleSectionTargetLanguageChange,
  } = useModalHandlers({
    setIsPasteModalOpen,
    setIsImportModalOpen,
    setIsExportModalOpen,
    setIsSettingsOpen,
    setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen,
    setIsSearchReplaceOpen,
    setSectionTargetLanguages,
  });

  const { handleCreateEmptySong } = useSessionActions({
    song, structure, rhymeScheme, appState,
    replaceStateWithoutHistory, clearHistory, clearSelection,
    resetWebSimilarityIndex, resetSuggestionCycle,
    updateSongAndStructureWithHistory, setIsResetModalOpen,
  });

  const { handleOpenSaveToLibraryModal } = useLibraryActions({
    song, replaceStateWithoutHistory, clearHistory,
    setSimilarityMatches, setLibraryCount, setLibraryAssets,
    setIsSavingToLibrary, setIsSaveToLibraryModalOpen,
  });

  const { handleImportInputChange, handleImportChooseFile } = useImportHandlers({
    importInputRef, loadFileForAnalysis,
    setIsImportModalOpen, setIsPasteModalOpen, setPastedText, setSongLanguage,
  });

  // setIsStructureOpenAndClearLine is now passed as a prop from AppInnerContent.
  // No local redefinition needed.

  const handleGenerateSongFromLeftPanel = useCallback(() => {
    setIsLeftPanelOpen(false);
    handleGlobalRegenerate();
  }, [setIsLeftPanelOpen, handleGlobalRegenerate]);

  const handleToggleAnalysisPanel = useCallback(() => {
    setIsAnalysisPanelOpen(prev => !prev);
  }, [setIsAnalysisPanelOpen]);

  const handleCloseAnalysisPanel = useCallback(() => {
    setIsAnalysisPanelOpen(false);
  }, [setIsAnalysisPanelOpen]);

  const isSuggestionsOpen = activeTab === 'lyrics' && Boolean(selectedLineId);

  return (
    <div className="flex-1 flex overflow-hidden">
      <ErrorBoundary label="Left panel">
        <Suspense fallback={<LazyFallback />}>
          <LeftSettingsPanel
            isMobileOverlay={isMobileOrTablet}
            title={title} setTitle={handleTitleChange} titleOrigin={titleOrigin}
            onGenerateTitle={handleGenerateTitle} isGeneratingTitle={isGeneratingTitle}
            topic={topic} setTopic={setTopic} mood={mood} setMood={setMood}
            rhymeScheme={rhymeScheme} setRhymeScheme={setRhymeScheme}
            targetSyllables={targetSyllables} setTargetSyllables={setTargetSyllables}
            isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
            onSurprise={handleSurpriseClick} isSurprising={isSurprising}
            hasApiKey={hasApiKey}
            onGenerateSong={handleGenerateSongFromLeftPanel}
            onRegenerateSong={handleGlobalRegenerate}
          />
        </Suspense>
      </ErrorBoundary>

      <div className="flex-1 flex flex-col min-w-0 bg-fluent-bg relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded" />
        <ErrorBoundary label="Top ribbon">
          <Suspense fallback={<LazyFallback />}>
            <TopRibbon
              setIsVersionsModalOpen={setIsVersionsModalOpen}
              setIsResetModalOpen={setIsResetModalOpen}
              hasApiKey={hasApiKey} handleApiKeyHelp={handleApiKeyHelp}
              onOpenNewGeneration={handleOpenNewGeneration}
              onOpenNewEmpty={handleCreateEmptySong}
              onImportClick={handleOpenImport}
              onExportClick={handleOpenExport}
              onOpenLibraryClick={handleOpenSaveToLibraryModal}
              onOpenSettingsClick={handleOpenSettings}
              onOpenAboutClick={handleOpenAbout}
              onOpenKeyboardShortcutsClick={handleOpenKeyboardShortcuts}
              canPasteLyrics={canPasteLyrics}
              onPasteLyrics={handleOpenPasteModal}
              isAnalyzing={isAnalyzing}
            />
          </Suspense>
        </ErrorBoundary>

        <AppEditorZone
          activeTab={activeTab}
          isMobileOrTablet={isMobileOrTablet}
          hasApiKey={hasApiKey}
          songHasContent={song.length > 0}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          isAdaptingLanguage={isAdaptingLanguage}
          isDetectingLanguage={isDetectingLanguage}
          isAnalyzing={isAnalyzing}
          editMode={editMode}
          switchEditMode={switchEditMode}
          webSimilarityIndex={webSimilarityIndex}
          webBadgeLabel={webBadgeLabel}
          libraryCount={libraryCount}
          adaptSongLanguage={adaptSongLanguage}
          detectLanguage={detectLanguage}
          analyzeCurrentSong={analyzeCurrentSong}
          setIsSimilarityModalOpen={setIsSimilarityModalOpen}
          adaptationProgress={adaptationProgress}
          adaptationResult={adaptationResult}
          playAudioFeedback={playAudioFeedback}
          canPasteLyrics={canPasteLyrics}
          onOpenLibrary={handleOpenSaveToLibraryModal}
          onPasteLyrics={handleOpenPasteModal}
          onGenerateSong={handleGlobalRegenerate}
          onOpenSearch={handleOpenSearch}
          onToggleAnalysisPanel={handleToggleAnalysisPanel}
          isAnalysisPanelOpen={isAnalysisPanelOpen}
        />
      </div>

      <ErrorBoundary label="Right panel">
        <Suspense fallback={<LazyFallback />}>
          {isAnalysisPanelOpen ? (
            <AnalysisPanel
              result={linguisticsWorker.result}
              isComputing={linguisticsWorker.isComputing}
              error={linguisticsWorker.error}
              isOpen={isAnalysisPanelOpen}
              onClose={handleCloseAnalysisPanel}
              isMobileOverlay={isMobileOrTablet}
            />
          ) : isSuggestionsOpen ? (
            <SuggestionsPanel
              isMobileOverlay={isMobileOrTablet}
              className={isMobileOrTablet ? 'structure-sidebar-mobile-overlay' : undefined}
              selectedLineId={selectedLineId}
              setSelectedLineId={setSelectedLineId}
              suggestions={suggestions}
              isSuggesting={isSuggesting}
              hasApiKey={hasApiKey}
              applySuggestion={applySuggestion}
              generateSuggestions={generateSuggestions}
              spellCheck={spellCheck}
            />
          ) : (
            <StructureSidebar
              isMobileOverlay={isMobileOrTablet}
              className={isMobileOrTablet ? 'structure-sidebar-mobile-overlay' : undefined}
              isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpenAndClearLine}
              isSectionDropdownOpen={isSectionDropdownOpen}
              setIsSectionDropdownOpen={setIsSectionDropdownOpen}
              addStructureItem={addStructureItem} removeStructureItem={removeStructureItem}
              onScrollToSection={handleScrollToSection}
              onRegenerateSong={handleGlobalRegenerate}
              onGenerateSong={generateSong}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

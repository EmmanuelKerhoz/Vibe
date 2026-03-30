import React, { useEffect, useRef, useCallback } from 'react';
import { ErrorBoundary } from './components/app/ErrorBoundary';
import { AppShell } from './components/app/AppShell';
import { AppEditorZone } from './components/app/AppEditorZone';
import { AppModalLayer } from './components/app/AppModalLayer';
import { useSongEditor } from './hooks/useSongEditor';
import { useTitleGenerator } from './hooks/useTitleGenerator';
import { useTopicMoodSuggester } from './hooks/useTopicMoodSuggester';
import { useSimilarityEngine } from './hooks/useSimilarityEngine';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { useMarkupEditor } from './hooks/useMarkupEditor';
import { useMobileLayout } from './hooks/useMobileLayout';
import { useMobileInitPanels } from './hooks/useMobileInitPanels';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSessionActions } from './hooks/useSessionActions';
import { useLibraryActions } from './hooks/useLibraryActions';
import { useDerivedAppState } from './hooks/useDerivedAppState';
import { useAppHandlers } from './hooks/useAppHandlers';
import { useModalHandlers } from './hooks/useModalHandlers';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useImportHandlers } from './hooks/useImportHandlers';
import { ModalProvider } from './contexts/ModalContext';
import { DragProvider } from './contexts/DragContext';
import { DragHandlersProvider } from './contexts/DragHandlersContext';
import { EditorProvider } from './contexts/EditorContext';
import { AnalysisProvider, useAnalysisContext } from './contexts/AnalysisContext';
import { AppStateProvider, useAppStateContext } from './contexts/AppStateContext';
import { TranslationAdaptationProvider } from './contexts/TranslationAdaptationContext';
import { VersionProvider, useVersionContext } from './contexts/VersionContext';
import { LeftSettingsPanel } from './components/app/LeftSettingsPanel';
import { TopRibbon } from './components/app/TopRibbon';
import { StructureSidebar } from './components/app/StructureSidebar';
import { StatusBar } from './components/app/StatusBar';
import { SuggestionsPanel } from './components/app/SuggestionsPanel';
import { MobileBottomNav } from './components/app/MobileBottomNav';
import { useTranslation, useLanguage } from './i18n';
import { SongProvider, useSongContext } from './contexts/SongContext';
import { ComposerProvider, useComposerContext } from './contexts/ComposerContext';

function ModalShortcutBindings({
  isMobileOrTablet,
  closeMobilePanels,
  undo,
  redo,
}: {
  isMobileOrTablet: boolean;
  closeMobilePanels: () => void;
  undo: () => void;
  redo: () => void;
}) {
  useKeyboardShortcuts({ isMobileOrTablet, closeMobilePanels, undo, redo });
  return null;
}

function AppInnerContent() {
  const { t } = useTranslation();
  const {
    song, structure, past, future, updateState, updateSongWithHistory, updateStructureWithHistory,
    updateSongAndStructureWithHistory, replaceStateWithoutHistory, clearHistory, undo, redo,
    title, setTitle, titleOrigin, setTitleOrigin, topic, setTopic, mood, setMood,
    rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables, genre, setGenre, tempo, setTempo,
    instrumentation, setInstrumentation, rhythm, setRhythm, narrative, setNarrative,
    musicalPrompt, setMusicalPrompt,
    shouldAutoGenerateTitle,
    songLanguage, setSongLanguage,
  } = useSongContext();
  const {
    isGenerating, isRegeneratingSection,
    selectedLineId, setSelectedLineId, suggestions, isSuggesting, generateSong, regenerateSection,
    quantizeSyllables, generateSuggestions, updateLineText, handleLineKeyDown, applySuggestion,
    handleLineClick, handleInstructionChange, addInstruction, removeInstruction, clearSelection,
  } = useComposerContext();

  const { appState, uiStateForProvider } = useAppStateContext();
  const {
    theme, setTheme, activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen, isLeftPanelOpen, setIsLeftPanelOpen,
    audioFeedback, setAudioFeedback, uiScale, setUiScale,
    defaultEditMode, setDefaultEditMode,
    showTranslationFeatures, setShowTranslationFeatures,
    similarityMatches, setSimilarityMatches, libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets, isSavingToLibrary, setIsSavingToLibrary,
    editMode, setEditMode, markupText, setMarkupText,
    isAboutOpen, setIsAboutOpen, isSettingsOpen, setIsSettingsOpen,
    apiErrorModal, setApiErrorModal,
    isImportModalOpen, setIsImportModalOpen, isExportModalOpen, setIsExportModalOpen,
    isSectionDropdownOpen, setIsSectionDropdownOpen,
    isSimilarityModalOpen, setIsSimilarityModalOpen,
    isSaveToLibraryModalOpen, setIsSaveToLibraryModalOpen,
    isVersionsModalOpen, setIsVersionsModalOpen,
    isResetModalOpen, setIsResetModalOpen,
    isKeyboardShortcutsModalOpen, setIsKeyboardShortcutsModalOpen,
    confirmModal, setConfirmModal, promptModal, setPromptModal,
    isPasteModalOpen, setIsPasteModalOpen,
    isAnalysisModalOpen, setIsAnalysisModalOpen,
    isSearchReplaceOpen, setIsSearchReplaceOpen,
    setHasSavedSession, isSessionHydrated, setIsSessionHydrated,
    hasApiKey, importInputRef, markupTextareaRef,
  } = appState;

  const { versions, saveVersion, rollbackToVersion, handleRequestVersionName } = useVersionContext();

  const { isMobile, isTablet } = useMobileLayout();
  const isMobileOrTablet = isMobile || isTablet;
  useMobileInitPanels({ isMobileOrTablet, setIsLeftPanelOpen, setIsStructureOpen });
  const isSuggestionsOpen = activeTab === 'lyrics' && Boolean(selectedLineId);

  const setIsStructureOpenAndClearLine = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsStructureOpen(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (next) setSelectedLineId(null);
      return next;
    });
  }, [setIsStructureOpen, setSelectedLineId]);

  const closeMobilePanels = useCallback(() => {
    setIsLeftPanelOpen(false);
    setIsStructureOpen(false);
    setSelectedLineId(null);
  }, [setIsLeftPanelOpen, setIsStructureOpen, setSelectedLineId]);

  const showBackdrop = isMobileOrTablet && (isLeftPanelOpen || isStructureOpen || isSuggestionsOpen);

  useSessionPersistence({
    song, structure, title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt, songLanguage,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession,
    replaceStateWithoutHistory, clearHistory,
  });

  const { playAudioFeedback } = useAudioFeedback(audioFeedback);

  // Stable ref so DragHandlersProvider never re-renders on audio toggle.
  // Pattern mirrors isGeneratingRef in AppProviders.
  const playAudioFeedbackRef = useRef(playAudioFeedback);
  playAudioFeedbackRef.current = playAudioFeedback;

  const { scrollToSection, handleMarkupToggle, switchEditMode, markupDirection } = useMarkupEditor({
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    updateSongAndStructureWithHistory,
  });

  const {
    canPasteLyrics,
    pastedText,
    setPastedText,
    isAnalyzing,
    isAnalyzingTheme,
    importProgress,
    analysisReport,
    analysisSteps,
    appliedAnalysisItems,
    selectedAnalysisItems,
    isApplyingAnalysis,
    targetLanguage,
    setTargetLanguage,
    isAdaptingLanguage,
    isDetectingLanguage,
    adaptationProgress,
    adaptationResult,
    sectionTargetLanguages,
    setSectionTargetLanguages,
    toggleAnalysisItemSelection,
    applyAnalysisItem,
    applySelectedAnalysisItems,
    analyzeCurrentSong,
    detectLanguage,
    adaptSongLanguage,
    adaptSectionLanguage,
    adaptLineLanguage,
    adaptingLineIds,
    analyzePastedLyrics,
    clearAppliedAnalysisItems,
  } = useAnalysisContext();

  const hasAppliedDefaultEditModeRef = useRef(false);
  useEffect(() => {
    if (isSessionHydrated && !hasAppliedDefaultEditModeRef.current) {
      hasAppliedDefaultEditModeRef.current = true;
      if (defaultEditMode !== 'section') switchEditMode(defaultEditMode);
    }
  }, [isSessionHydrated, defaultEditMode, switchEditMode]);

  const previousActiveTabRef = useRef(activeTab);
  useEffect(() => {
    const prev = previousActiveTabRef.current;
    previousActiveTabRef.current = activeTab;

    if (activeTab !== 'lyrics' && editMode !== 'section') {
      setEditMode('section');
    } else if (activeTab === 'lyrics' && prev !== 'lyrics' && hasAppliedDefaultEditModeRef.current) {
      if (defaultEditMode !== 'section' && editMode === 'section') {
        switchEditMode(defaultEditMode);
      }
    }
  }, [activeTab, editMode, defaultEditMode, setEditMode, switchEditMode]);

  useEffect(() => {
    if (isSuggestionsOpen && isStructureOpen) {
      setIsStructureOpen(false);
    }
  }, [isSuggestionsOpen, isStructureOpen, setIsStructureOpen]);

  const {
    removeStructureItem, addStructureItem, exportSong, loadFileForAnalysis,
  } = useSongEditor({
    openPasteModalWithText: (text: string) => { setPastedText(text); setIsPasteModalOpen(true); },
  });

  const { generateTitle, isGeneratingTitle } = useTitleGenerator();
  const {
    generateSuggestion: handleSurprise,
    isGeneratingSuggestion: isSurprising,
    resetSuggestionCycle,
  } = useTopicMoodSuggester({ hasApiKey });

  const handleSurpriseClick = useCallback(async () => {
    const suggestion = await handleSurprise();
    if (suggestion) {
      setTopic(suggestion.topic);
      setMood(suggestion.mood);
    }
  }, [handleSurprise, setMood, setTopic]);

  const {
    index: webSimilarityIndex,
    triggerNow: triggerWebSimilarity,
    resetIndex: resetWebSimilarityIndex,
  } = useSimilarityEngine({ hasApiKey });

  const { hasRealLyricContent, hasExistingWork, webBadgeLabel } = useDerivedAppState({
    editMode, markupText,
    webSimilarityIndex,
  });

  const hasSyncedInitialLeftPanelRef = useRef(false);
  const previousHasRealLyricContentRef = useRef(hasRealLyricContent);

  useEffect(() => {
    if (!isSessionHydrated) return;

    const hadRealLyricContent = previousHasRealLyricContentRef.current;
    previousHasRealLyricContentRef.current = hasRealLyricContent;

    if (!hasSyncedInitialLeftPanelRef.current) {
      hasSyncedInitialLeftPanelRef.current = true;
      setIsLeftPanelOpen(!hasRealLyricContent);
      return;
    }

    if (hadRealLyricContent && !hasRealLyricContent) {
      setIsLeftPanelOpen(true);
    }
  }, [hasRealLyricContent, isSessionHydrated, setIsLeftPanelOpen]);

  const {
    handleApiKeyHelp, handleTitleChange, handleGenerateTitle,
    handleGlobalRegenerate, handleScrollToSection, handleOpenNewGeneration,
  } = useAppHandlers({
    t, hasRealLyricContent, isMobileOrTablet,
    setApiErrorModal, setConfirmModal, setActiveTab,
    setIsLeftPanelOpen, setIsStructureOpen,
    generateTitle, generateSong, scrollToSection,
  });

  const {
    handleOpenPasteModal,
    handleOpenPasteLyricsFromModals,
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

  const { handleCreateEmptySong, resetSong } = useSessionActions({
    song, structure, rhymeScheme, appState,
    replaceStateWithoutHistory, clearHistory, clearSelection,
    resetWebSimilarityIndex, resetSuggestionCycle,
    updateSongAndStructureWithHistory, setIsResetModalOpen,
  });

  const {
    handleSaveToLibrary, handleLoadLibraryAsset,
    handleDeleteLibraryAsset, handlePurgeLibrary, handleOpenSaveToLibraryModal,
  } = useLibraryActions({
    song, replaceStateWithoutHistory, clearHistory,
    setSimilarityMatches, setLibraryCount, setLibraryAssets,
    setIsSavingToLibrary, setIsSaveToLibraryModalOpen,
  });

  const { handleImportInputChange, handleImportChooseFile } = useImportHandlers({
    importInputRef, loadFileForAnalysis,
    setIsImportModalOpen, setIsPasteModalOpen, setPastedText, setSongLanguage,
  });

  const handleGenerateSongFromLeftPanel = useCallback(() => {
    setIsLeftPanelOpen(false);
    handleGlobalRegenerate();
  }, [setIsLeftPanelOpen, handleGlobalRegenerate]);

  return (
    <TranslationAdaptationProvider
      sectionTargetLanguages={sectionTargetLanguages}
      onSectionTargetLanguageChange={handleSectionTargetLanguageChange}
      adaptSectionLanguage={adaptSectionLanguage}
      adaptLineLanguage={adaptLineLanguage}
      adaptingLineIds={adaptingLineIds}
      showTranslationFeatures={showTranslationFeatures}
    >
      <DragHandlersProvider playAudioFeedbackRef={playAudioFeedbackRef}>
        <ModalShortcutBindings
          isMobileOrTablet={isMobileOrTablet}
          closeMobilePanels={closeMobilePanels}
          undo={undo}
          redo={redo}
        />
        <AppShell
          theme={theme}
          isMobileOrTablet={isMobileOrTablet}
          showBackdrop={showBackdrop}
          onBackdropClick={closeMobilePanels}
        >
          <div className="flex-1 flex overflow-hidden">
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
              isSessionHydrated={isSessionHydrated}
              onGenerateSong={handleGenerateSongFromLeftPanel}
              onRegenerateSong={handleGlobalRegenerate}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-fluent-bg relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded" />
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
                onOpenSearchClick={handleOpenSearch}
                canPasteLyrics={canPasteLyrics}
                onPasteLyrics={handleOpenPasteModal}
                isAnalyzing={isAnalyzing}
              />

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
              />
            </div>

            {isSuggestionsOpen ? (
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
          </div>

          <StatusBar
            className="lcars-status-bar-desktop"
            hasApiKey={hasApiKey}
            isAnalyzing={isAnalyzing}
            theme={theme} setTheme={setTheme}
            audioFeedback={audioFeedback} setAudioFeedback={setAudioFeedback}
            onOpenAbout={handleOpenAbout}
            onOpenSettings={handleOpenSettings}
          />

          {isMobileOrTablet && (
            <MobileBottomNav
              isLeftPanelOpen={isLeftPanelOpen} isStructureOpen={isStructureOpen}
              activeTab={activeTab}
              hasApiKey={hasApiKey}
              setIsLeftPanelOpen={setIsLeftPanelOpen} setIsStructureOpen={setIsStructureOpenAndClearLine}
              setActiveTab={setActiveTab} onGenerateSong={handleGlobalRegenerate}
              onOpenSettings={handleOpenSettings}
            />
          )}

          <AppModalLayer />
        </AppShell>
      </DragHandlersProvider>
    </TranslationAdaptationProvider>
  );
}

function AppProviders() {
  const { language } = useLanguage();
  const {
    updateState,
    updateSongAndStructureWithHistory,
    setShouldAutoGenerateTitle,
  } = useSongContext();
  const { isGenerating, clearSelection } = useComposerContext();
  const { appState, uiStateForProvider } = useAppStateContext();

  const { saveVersion } = useVersionContext();

  const isGeneratingRef = useRef(isGenerating);
  isGeneratingRef.current = isGenerating;

  const markupDirection = appState.markupText
    ? (/[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF]/.test(appState.markupText) ? 'rtl' : 'ltr')
    : 'ltr';

  return (
    <EditorProvider
      editMode={appState.editMode}
      setEditMode={appState.setEditMode}
      markupText={appState.markupText}
      setMarkupText={appState.setMarkupText}
      markupTextareaRef={appState.markupTextareaRef}
      markupDirection={markupDirection}
    >
      <ModalProvider uiState={uiStateForProvider}>
        <AnalysisProvider
          uiLanguage={language}
          isGeneratingRef={isGeneratingRef}
          hasApiKey={appState.hasApiKey}
          saveVersion={saveVersion}
          updateState={updateState}
          updateSongAndStructureWithHistory={updateSongAndStructureWithHistory}
          clearLineSelection={clearSelection}
          requestAutoTitleGeneration={() => setShouldAutoGenerateTitle(true)}
        >
          <AppInnerContent />
        </AnalysisProvider>
      </ModalProvider>
    </EditorProvider>
  );
}

function AppInner() {
  return (
    <AppStateProvider>
      <DragProvider>
        <SongProvider>
          <ComposerProvider>
            <VersionProvider>
              <AppProviders />
            </VersionProvider>
          </ComposerProvider>
        </SongProvider>
      </DragProvider>
    </AppStateProvider>
  );
}

export default function App() {
  return <AppInner />;
}

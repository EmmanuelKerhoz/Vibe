import React, { useEffect, useRef, useCallback } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useSongAnalysis } from './hooks/useSongAnalysis';
import { useSongEditor } from './hooks/useSongEditor';
import { useTitleGenerator } from './hooks/useTitleGenerator';
import { useTopicMoodSuggester } from './hooks/useTopicMoodSuggester';
import { useSimilarityEngine } from './hooks/useSimilarityEngine';
import { useAppState } from './hooks/useAppState';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { useVersionManager } from './hooks/useVersionManager';
import { useMarkupEditor } from './hooks/useMarkupEditor';
import { useMobileLayout } from './hooks/useMobileLayout';
import { useMobileInitPanels } from './hooks/useMobileInitPanels';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSessionActions } from './hooks/useSessionActions';
import { useImportHandlers } from './hooks/useImportHandlers';
import { useLibraryActions } from './hooks/useLibraryActions';
import { useUIStateForProvider } from './hooks/useUIStateForProvider';
import { useDerivedAppState } from './hooks/useDerivedAppState';
import { useAppHandlers } from './hooks/useAppHandlers';
import { useModalHandlers } from './hooks/useModalHandlers';
import { ModalProvider } from './contexts/ModalContext';
import { DragProvider } from './contexts/DragContext';
import { LeftSettingsPanel } from './components/app/LeftSettingsPanel';
import { TopRibbon } from './components/app/TopRibbon';
import { StructureSidebar } from './components/app/StructureSidebar';
import { StatusBar } from './components/app/StatusBar';
import { MusicalTab } from './components/app/musical/MusicalTab';
import { InsightsBar } from './components/app/InsightsBar';
import { LyricsView } from './components/app/LyricsView';
import { AppModals } from './components/app/AppModals';
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
  const { language } = useLanguage();
  const {
    song, structure, past, future, updateState, updateSongWithHistory, updateStructureWithHistory,
    updateSongAndStructureWithHistory, replaceStateWithoutHistory, clearHistory, undo, redo,
    title, setTitle, titleOrigin, setTitleOrigin, topic, setTopic, mood, setMood,
    rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables, genre, setGenre, tempo, setTempo,
    instrumentation, setInstrumentation, rhythm, setRhythm, narrative, setNarrative,
    musicalPrompt, setMusicalPrompt, newSectionName, setNewSectionName,
    shouldAutoGenerateTitle, setShouldAutoGenerateTitle,
    songLanguage, setSongLanguage,
  } = useSongContext();
  const {
    isGenerating, isRegeneratingSection,
    selectedLineId, setSelectedLineId, suggestions, isSuggesting, generateSong, regenerateSection,
    quantizeSyllables, generateSuggestions, updateLineText, handleLineKeyDown, applySuggestion,
    handleLineClick, handleInstructionChange, addInstruction, removeInstruction, clearSelection,
  } = useComposerContext();

  const appState = useAppState();
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
    setHasSavedSession, isSessionHydrated, setIsSessionHydrated,
    hasApiKey, importInputRef, markupTextareaRef,
  } = appState;

  // ── Mobile layout ─────────────────────────────────────────────────────────────────
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

  const { versions, saveVersion, rollbackToVersion, handleRequestVersionName } = useVersionManager({
    updateSongAndStructureWithHistory, setIsVersionsModalOpen, setPromptModal,
  });
  const { playAudioFeedback } = useAudioFeedback(audioFeedback);
  const { scrollToSection, handleMarkupToggle, switchEditMode, markupDirection } = useMarkupEditor({
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    updateSongAndStructureWithHistory,
  });

  const isGeneratingRef = useRef(isGenerating);
  isGeneratingRef.current = isGenerating;

  const {
    pastedText, setPastedText, isAnalyzing, analysisReport, analysisSteps,
    appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis,
    targetLanguage, setTargetLanguage, isAdaptingLanguage, isDetectingLanguage,
    adaptationProgress, adaptationResult, sectionTargetLanguages, setSectionTargetLanguages,
    toggleAnalysisItemSelection, applySelectedAnalysisItems,
    analyzeCurrentSong, detectLanguage, adaptSongLanguage, adaptSectionLanguage,
    analyzePastedLyrics, clearAppliedAnalysisItems,
  } = useSongAnalysis({
    uiLanguage: language, isGeneratingRef, saveVersion,
    updateState, updateSongAndStructureWithHistory,
    clearLineSelection: () => clearSelection(),
    requestAutoTitleGeneration: () => setShouldAutoGenerateTitle(true),
    setIsPasteModalOpen, setIsAnalysisModalOpen,
  });

  const hasAppliedDefaultEditModeRef = useRef(false);
  useEffect(() => {
    if (isSessionHydrated && !hasAppliedDefaultEditModeRef.current) {
      hasAppliedDefaultEditModeRef.current = true;
      if (defaultEditMode !== 'section') switchEditMode(defaultEditMode);
    }
  }, [isSessionHydrated, defaultEditMode, switchEditMode]);

  useEffect(() => {
    if (activeTab !== 'lyrics' && editMode !== 'section') setEditMode('section');
  }, [activeTab, editMode, setEditMode]);

  useEffect(() => {
    if (isSuggestionsOpen && isStructureOpen) {
      setIsStructureOpen(false);
    }
  }, [isSuggestionsOpen, isStructureOpen, setIsStructureOpen]);

  const {
    removeStructureItem, addStructureItem, normalizeStructure, handleDrop,
    handleLineDragStart, handleLineDrop, exportSong, loadFileForAnalysis,
  } = useSongEditor({
    openPasteModalWithText: (text: string) => { setPastedText(text); setIsPasteModalOpen(true); },
    playAudioFeedback,
  });

  const { generateTitle, isGeneratingTitle } = useTitleGenerator();
  const {
    generateSuggestion: handleSurprise,
    isGeneratingSuggestion: isSurprising,
    resetSuggestionCycle,
  } = useTopicMoodSuggester();

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
  } = useSimilarityEngine();

  // ── Derived state ─────────────────────────────────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────────────────────
  const {
    handleApiKeyHelp, handleTitleChange, handleGenerateTitle,
    handleGlobalRegenerate, handleScrollToSection, handleOpenNewGeneration,
  } = useAppHandlers({
    t, hasRealLyricContent, isMobileOrTablet,
    setApiErrorModal, setConfirmModal, setActiveTab,
    setIsLeftPanelOpen, setIsStructureOpen,
    generateTitle, generateSong, scrollToSection,
  });

  // ── Modal handlers ────────────────────────────────────────────────────────────────
  const {
    handleOpenPasteModal,
    handleOpenPasteLyricsFromModals,
    handleOpenImport,
    handleOpenExport,
    handleOpenSettings,
    handleOpenAbout,
    handleOpenKeyboardShortcuts,
    handleSectionTargetLanguageChange,
  } = useModalHandlers({
    setIsPasteModalOpen,
    setIsImportModalOpen,
    setIsExportModalOpen,
    setIsSettingsOpen,
    setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen,
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

  // ── ModalProvider injection ───────────────────────────────────────────────────────
  const uiStateForProvider = useUIStateForProvider({
    setIsAboutOpen, setIsSettingsOpen, setApiErrorModal,
    setIsImportModalOpen, setIsExportModalOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen, setIsSaveToLibraryModalOpen, setIsVersionsModalOpen,
    setIsResetModalOpen, setIsKeyboardShortcutsModalOpen, setConfirmModal, setPromptModal,
    setIsPasteModalOpen, setIsAnalysisModalOpen, setEditMode,
    isAboutOpen, isSettingsOpen, apiErrorModal,
    isImportModalOpen, isExportModalOpen, isSectionDropdownOpen,
    isSimilarityModalOpen, isSaveToLibraryModalOpen, isVersionsModalOpen,
    isResetModalOpen, isKeyboardShortcutsModalOpen, confirmModal, promptModal,
    isPasteModalOpen, isAnalysisModalOpen,
    activeTab, setActiveTab, isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    editMode, markupText, setMarkupText,
    markupTextareaRef, importInputRef,
    shouldAutoGenerateTitle, setShouldAutoGenerateTitle,
  });

  const handleGenerateSongFromLeftPanel = useCallback(() => {
    setIsLeftPanelOpen(false);
    handleGlobalRegenerate();
  }, [setIsLeftPanelOpen, handleGlobalRegenerate]);

  return (
    <ModalProvider uiState={uiStateForProvider}>
      <ModalShortcutBindings
        isMobileOrTablet={isMobileOrTablet}
        closeMobilePanels={closeMobilePanels}
        undo={undo}
        redo={redo}
      />
      <FluentProvider
        theme={theme === 'dark' ? webDarkTheme : webLightTheme}
        style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}
      >
        <div className={`fui-FluentProvider ui-fluent h-screen w-full bg-fluent-bg text-zinc-400 flex flex-col overflow-hidden font-sans selection:bg-[var(--accent-color)]/30 ${theme === 'dark' ? 'dark' : ''}`}>

          {showBackdrop && (
            <button
              type="button"
              className="mobile-panel-backdrop"
              onClick={closeMobilePanels}
              aria-label="Close mobile panels"
            />
          )}

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
              isSessionHydrated={isSessionHydrated}
              onGenerateSong={handleGenerateSongFromLeftPanel}
              onRegenerateSong={handleGlobalRegenerate}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-fluent-bg relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded" />
              <TopRibbon
                activeTab={activeTab} setActiveTab={setActiveTab}
                setIsVersionsModalOpen={setIsVersionsModalOpen}
                setIsResetModalOpen={setIsResetModalOpen}
                isLeftPanelOpen={isLeftPanelOpen}
                setIsLeftPanelOpen={setIsLeftPanelOpen}
                isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpenAndClearLine}
                hasApiKey={hasApiKey} handleApiKeyHelp={handleApiKeyHelp}
                onOpenNewGeneration={handleOpenNewGeneration}
                onOpenNewEmpty={handleCreateEmptySong}
                onImportClick={handleOpenImport}
                onExportClick={handleOpenExport}
                onOpenLibraryClick={handleOpenSaveToLibraryModal}
                onOpenSettingsClick={handleOpenSettings}
                onOpenAboutClick={handleOpenAbout}
                onOpenKeyboardShortcutsClick={handleOpenKeyboardShortcuts}
                onPasteLyrics={handleOpenPasteModal}
                isAnalyzing={isAnalyzing}
              />

              {activeTab === 'lyrics' && song.length > 0 && (
                <InsightsBar
                  targetLanguage={targetLanguage} setTargetLanguage={setTargetLanguage}
                  isAdaptingLanguage={isAdaptingLanguage} isDetectingLanguage={isDetectingLanguage}
                  isAnalyzing={isAnalyzing}
                  editMode={editMode} switchEditMode={switchEditMode}
                  webSimilarityIndex={webSimilarityIndex}
                  webBadgeLabel={webBadgeLabel}
                  libraryCount={libraryCount} adaptSongLanguage={adaptSongLanguage}
                  detectLanguage={detectLanguage} analyzeCurrentSong={analyzeCurrentSong}
                  setIsSimilarityModalOpen={setIsSimilarityModalOpen}
                  adaptationProgress={adaptationProgress} adaptationResult={adaptationResult}
                  showTranslationFeatures={showTranslationFeatures}
                />
              )}

              <div
                className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative lcars-lyrics-area ${isMobileOrTablet ? 'p-2' : 'p-4 lg:p-8'}`}
                style={isMobileOrTablet ? { paddingBottom: 'calc(60px + var(--sab))' } : undefined}
              >
                <div className="lyrics-editor-zoom-wrapper">
                  <div className="lyrics-editor-zoom">
                    {activeTab === 'lyrics' ? (
                      <LyricsView
                        isAnalyzing={isAnalyzing}
                        isAdaptingLanguage={isAdaptingLanguage}
                        sectionTargetLanguages={sectionTargetLanguages}
                        onSectionTargetLanguageChange={handleSectionTargetLanguageChange}
                        adaptSectionLanguage={adaptSectionLanguage}
                        playAudioFeedback={playAudioFeedback}
                        handleDrop={handleDrop}
                        handleLineDragStart={handleLineDragStart}
                        handleLineDrop={handleLineDrop}
                        editMode={editMode} setEditMode={setEditMode}
                        markupText={markupText} setMarkupText={setMarkupText}
                        markupTextareaRef={markupTextareaRef}
                        markupDirection={markupDirection}
                        onOpenLibrary={handleOpenSaveToLibraryModal}
                        onPasteLyrics={handleOpenPasteModal}
                        onGenerateSong={handleGlobalRegenerate}
                        showTranslationFeatures={showTranslationFeatures}
                      />
                    ) : (
                      <MusicalTab hasApiKey={hasApiKey} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isSuggestionsOpen ? (
              <SuggestionsPanel
                isMobileOverlay={isMobileOrTablet}
                className={isMobileOrTablet ? 'structure-sidebar-mobile-overlay' : undefined}
                selectedLineId={selectedLineId}
                setSelectedLineId={setSelectedLineId}
                suggestions={suggestions}
                isSuggesting={isSuggesting}
                applySuggestion={applySuggestion}
                generateSuggestions={generateSuggestions}
              />
            ) : (
              <StructureSidebar
                isMobileOverlay={isMobileOrTablet}
                className={isMobileOrTablet ? 'structure-sidebar-mobile-overlay' : undefined}
                isStructureOpen={isStructureOpen} setIsStructureOpen={setIsStructureOpenAndClearLine}
                newSectionName={newSectionName} setNewSectionName={setNewSectionName}
                isSectionDropdownOpen={isSectionDropdownOpen}
                setIsSectionDropdownOpen={setIsSectionDropdownOpen}
                addStructureItem={addStructureItem} removeStructureItem={removeStructureItem}
                normalizeStructure={normalizeStructure} handleDrop={handleDrop}
                onScrollToSection={handleScrollToSection}
                onRegenerateSong={handleGlobalRegenerate}
                onGenerateSong={generateSong}
              />
            )}
          </div>

          <StatusBar
            className="lcars-status-bar-desktop"
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
              setIsLeftPanelOpen={setIsLeftPanelOpen} setIsStructureOpen={setIsStructureOpenAndClearLine}
              setActiveTab={setActiveTab} onGenerateSong={handleGlobalRegenerate}
              onOpenSettings={handleOpenSettings}
            />
          )}

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
            isAnalyzing={isAnalyzing} analyzePastedLyrics={analyzePastedLyrics}
            analysisReport={analysisReport} analysisSteps={analysisSteps}
            appliedAnalysisItems={appliedAnalysisItems}
            selectedAnalysisItems={selectedAnalysisItems}
            isApplyingAnalysis={isApplyingAnalysis}
            toggleAnalysisItemSelection={toggleAnalysisItemSelection}
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
        </div>
      </FluentProvider>
    </ModalProvider>
  );
}

function AppInner() {
  return (
    <DragProvider>
      <SongProvider>
        <ComposerProvider>
          <AppInnerContent />
        </ComposerProvider>
      </SongProvider>
    </DragProvider>
  );
}

export default function App() {
  return <AppInner />;
}

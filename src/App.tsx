import React, { useRef, useCallback } from 'react';
import { ErrorBoundary } from './components/app/ErrorBoundary';
import { AppShell } from './components/app/AppShell';
import { AppEditorLayout } from './components/app/AppEditorLayout';
import { AppPanelOrchestrator } from './components/app/AppPanelOrchestrator';
import { AppModalLayer } from './components/app/AppModalLayer';
import { useTopicMoodSuggester } from './hooks/useTopicMoodSuggester';
import { useTitleGenerator } from './hooks/useTitleGenerator';
import { useSimilarityContext, SimilarityProvider } from './contexts/SimilarityContext';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { useMarkupEditor } from './hooks/useMarkupEditor';
import { useMobileLayout } from './hooks/useMobileLayout';
import { useMobileInitPanels } from './hooks/useMobileInitPanels';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSessionActions } from './hooks/useSessionActions';
import { useDerivedAppState } from './hooks/useDerivedAppState';
import { useAppHandlers } from './hooks/useAppHandlers';
import { useModalHandlers } from './hooks/useModalHandlers';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { ModalProvider } from './contexts/ModalContext';
import { DragProvider } from './contexts/DragContext';
import { DragHandlersProvider } from './contexts/DragHandlersContext';
import { EditorProvider } from './contexts/EditorContext';
import { AnalysisProvider, useAnalysisContext } from './contexts/AnalysisContext';
import { AppStateProvider, useAppStateContext } from './contexts/AppStateContext';
import { TranslationAdaptationProvider } from './contexts/TranslationAdaptationContext';
import { VersionProvider, useVersionContext } from './contexts/VersionContext';
import { StatusBar } from './components/app/StatusBar';
import { MobileBottomNav } from './components/app/MobileBottomNav';
import { useTranslation, useLanguage } from './i18n';
import { SongProvider, useSongContext } from './contexts/SongContext';
import { SongMutationProvider } from './contexts/SongMutationContext';
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
  const {
    song, structure,
    title, titleOrigin, topic, mood, rhymeScheme, targetSyllables,
    genre, tempo, instrumentation, rhythm, narrative, musicalPrompt,
    songLanguage,
    replaceStateWithoutHistory, clearHistory, undo, redo,
    updateSongAndStructureWithHistory,
  } = useSongContext();
  const { selectedLineId, setSelectedLineId, clearSelection, generateSong } = useComposerContext();

  const { appState } = useAppStateContext();
  const {
    theme, setTheme, activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen, isLeftPanelOpen, setIsLeftPanelOpen,
    audioFeedback, setAudioFeedback,
    showTranslationFeatures,
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    isSessionHydrated, setIsSessionHydrated, setHasSavedSession,
    setIsResetModalOpen,
    hasApiKey,
  } = appState;

  const { isMobile, isTablet } = useMobileLayout();
  const isMobileOrTablet = isMobile || isTablet;
  useMobileInitPanels({ isMobileOrTablet, setIsLeftPanelOpen, setIsStructureOpen });
  const isSuggestionsOpen = activeTab === 'lyrics' && Boolean(selectedLineId);

  /**
   * Defined once here; passed down to both MobileBottomNav and AppEditorLayout
   * (which forwards it to StructureSidebar).
   * Single source of truth — no duplicate definition in AppEditorLayout.
   */
  const setIsStructureOpenAndClearLine = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsStructureOpen(prev => {
        const next = typeof value === 'function' ? value(prev) : value;
        if (next) setSelectedLineId(null);
        return next;
      });
    },
    [setIsStructureOpen, setSelectedLineId],
  );

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
  const playAudioFeedbackRef = useRef(playAudioFeedback);
  playAudioFeedbackRef.current = playAudioFeedback;

  const {
    isAnalyzing,
    sectionTargetLanguages, setSectionTargetLanguages,
    adaptSectionLanguage, adaptLineLanguage, adaptingLineIds,
  } = useAnalysisContext();

  const { index: webSimilarityIndex, resetIndex: resetWebSimilarityIndex } = useSimilarityContext();

  const { resetSuggestionCycle } = useTopicMoodSuggester({ hasApiKey });

  const { scrollToSection } = useMarkupEditor({
    editMode, markupText, markupTextareaRef, setEditMode, setMarkupText,
    updateSongAndStructureWithHistory,
  });

  const { hasRealLyricContent } = useDerivedAppState({ editMode, markupText, webSimilarityIndex });

  const { generateTitle } = useTitleGenerator();
  const { t } = useTranslation();

  const { handleGlobalRegenerate } = useAppHandlers({
    t, hasRealLyricContent, isMobileOrTablet,
    setApiErrorModal: appState.setApiErrorModal, setConfirmModal: appState.setConfirmModal,
    setActiveTab, setIsLeftPanelOpen, setIsStructureOpen,
    generateTitle, generateSong, scrollToSection,
  });

  const {
    handleOpenSettings,
    handleOpenAbout,
    handleSectionTargetLanguageChange,
  } = useModalHandlers({
    setIsPasteModalOpen: appState.setIsPasteModalOpen,
    setIsImportModalOpen: appState.setIsImportModalOpen,
    setIsExportModalOpen: appState.setIsExportModalOpen,
    setIsSettingsOpen: appState.setIsSettingsOpen,
    setIsAboutOpen: appState.setIsAboutOpen,
    setIsKeyboardShortcutsModalOpen: appState.setIsKeyboardShortcutsModalOpen,
    setIsSearchReplaceOpen: appState.setIsSearchReplaceOpen,
    setSectionTargetLanguages,
  });

  useSessionActions({
    song, structure, rhymeScheme, appState,
    replaceStateWithoutHistory, clearHistory, clearSelection,
    resetWebSimilarityIndex, resetSuggestionCycle,
    updateSongAndStructureWithHistory, setIsResetModalOpen,
  });

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
        <AppPanelOrchestrator />
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
          <AppEditorLayout
            isMobileOrTablet={isMobileOrTablet}
            playAudioFeedback={playAudioFeedback}
            setIsStructureOpenAndClearLine={setIsStructureOpenAndClearLine}
          />

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
          <ErrorBoundary>
            <AppInnerContent />
          </ErrorBoundary>
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
          <SongMutationProvider>
            <ComposerProvider>
              <VersionProvider>
                <SimilarityProvider>
                  <AppProviders />
                </SimilarityProvider>
              </VersionProvider>
            </ComposerProvider>
          </SongMutationProvider>
        </SongProvider>
      </DragProvider>
    </AppStateProvider>
  );
}

export default function App() {
  return <AppInner />;
}

import React, { useCallback } from 'react';
import { ErrorBoundary } from './components/app/ErrorBoundary';
import { AppShell } from './components/app/AppShell';
import { AppEditorLayout } from './components/app/AppEditorLayout';
import { AppPanelOrchestrator } from './components/app/AppPanelOrchestrator';
import { AppModalLayer } from './components/app/AppModalLayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMobileLayout } from './hooks/useMobileLayout';
import { useMobileInitPanels } from './hooks/useMobileInitPanels';
import { useAppOrchestration } from './hooks/useAppOrchestration';
import { SimilarityProvider } from './contexts/SimilarityContext';
import { ModalProvider } from './contexts/ModalContext';
import { DragProvider } from './contexts/DragContext';
import { DragHandlersProvider } from './contexts/DragHandlersContext';
import { EditorProvider } from './contexts/EditorContext';
import { AnalysisProvider } from './contexts/AnalysisContext';
import { AppStateProvider, useAppStateContext, useAppNavigationContext } from './contexts/AppStateContext';
import { TranslationAdaptationProvider } from './contexts/TranslationAdaptationContext';
import { VersionProvider, useVersionContext } from './contexts/VersionContext';
import { StatusBar } from './components/app/StatusBar';
import { MobileBottomNav } from './components/app/MobileBottomNav';
import { useLanguage } from './i18n';
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
  // ── Song state (only what JSX needs directly) ─────────────────────────
  const { undo, redo } = useSongContext();
  const { selectedLineId, setSelectedLineId } = useComposerContext();

  // ── Navigation context (isolated from modal churn) ────────────────────
  const {
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
  } = useAppNavigationContext();

  // ── Remaining app state (audio, theme, session flags) ─────────────────
  const { appState } = useAppStateContext();
  const { theme, setTheme, audioFeedback, setAudioFeedback, hasApiKey } = appState;

  // ── Mobile layout ─────────────────────────────────────────────────────
  const { isMobile, isTablet } = useMobileLayout();
  const isMobileOrTablet = isMobile || isTablet;
  useMobileInitPanels({ isMobileOrTablet, setIsLeftPanelOpen, setIsStructureOpen });

  const isSuggestionsOpen = activeTab === 'lyrics' && Boolean(selectedLineId);

  // ── Stable callbacks ──────────────────────────────────────────────────
  /**
   * Single source of truth — also forwarded to StructureSidebar via
   * AppEditorLayout. Clears the selected line whenever the structure panel
   * opens so the suggestion pane doesn't stay pinned.
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

  // ── Orchestration (session, audio, handlers, analysis…) ──────────────
  const {
    playAudioFeedback,
    playAudioFeedbackRef,
    handleGlobalRegenerate,
    handleOpenSettings,
    handleOpenAbout,
    handleSectionTargetLanguageChange,
    isAnalyzing,
    sectionTargetLanguages,
    setSectionTargetLanguages,
    adaptSectionLanguage,
    adaptLineLanguage,
    adaptingLineIds,
  } = useAppOrchestration();

  return (
    <TranslationAdaptationProvider
      sectionTargetLanguages={sectionTargetLanguages}
      onSectionTargetLanguageChange={handleSectionTargetLanguageChange}
      adaptSectionLanguage={adaptSectionLanguage}
      adaptLineLanguage={adaptLineLanguage}
      adaptingLineIds={adaptingLineIds}
      showTranslationFeatures={appState.showTranslationFeatures}
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

  const isGeneratingRef = React.useRef(isGenerating);
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

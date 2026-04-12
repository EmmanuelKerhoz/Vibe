import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from './components/app/ErrorBoundary';
import { AppShell } from './components/app/AppShell';
import { AppEditorLayout } from './components/app/AppEditorLayout';
import { AppPanelOrchestrator } from './components/app/AppPanelOrchestrator';
import { AppModalLayer } from './components/app/AppModalLayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppOrchestration } from './hooks/useAppOrchestration';
import { useEditorPanelState } from './hooks/useEditorPanelState';
import { useMobileSession } from './hooks/useMobileSession';
import { useSessionAutoSave } from './hooks/useSessionAutoSave';
import { SimilarityProvider } from './contexts/SimilarityContext';
import { ModalProvider } from './contexts/ModalContext';
import { DragProvider } from './contexts/DragContext';
import { DragHandlersProvider } from './contexts/DragHandlersContext';
import { EditorProvider } from './contexts/EditorContext';
import { AnalysisProvider } from './contexts/AnalysisContext';
import { AppStateProvider, useAppStateContext } from './contexts/AppStateContext';
import { TranslationAdaptationProvider } from './contexts/TranslationAdaptationContext';
import { VersionProvider, useVersionContext } from './contexts/VersionContext';
import { StatusBar } from './components/app/StatusBar';
import { MobileBottomNav } from './components/app/MobileBottomNav';
import { useLanguage } from './i18n';
import { SongProvider, useSongContext } from './contexts/SongContext';
import { SongMutationProvider } from './contexts/SongMutationContext';
import { ComposerProvider, useComposerContext } from './contexts/ComposerContext';
import { loadSession } from './lib/sessionPersistence';
import type { SessionSnapshot } from './lib/sessionPersistence';

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
  const { undo, redo } = useSongContext();
  const { isGenerating } = useComposerContext();
  const { appState } = useAppStateContext();
  const {
    theme, setTheme, audioFeedback, setAudioFeedback, hasApiKey,
    hasSavedSession, setHasSavedSession,
  } = appState;

  const {
    activeTab, setActiveTab,
    isStructureOpen, isLeftPanelOpen, setIsLeftPanelOpen,
    isSuggestionsOpen,
    setIsStructureOpenAndClearLine,
    showBackdrop,
  } = useEditorPanelState();

  const { isMobileOrTablet, closeMobilePanels } = useMobileSession({
    setIsLeftPanelOpen,
    setIsStructureOpen: setIsStructureOpenAndClearLine,
  });

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
  } = useAppOrchestration(isMobileOrTablet);

  // ── Auto-save to OPFS ─────────────────────────────────────────────────
  const songCtx = useSongContext();
  // Stable ref — never triggers useSessionAutoSave dep array
  const onSavedRef = useRef<(() => void) | null>(null);
  onSavedRef.current = hasSavedSession ? null : () => setHasSavedSession(true);

  const onSaved = useRef(() => { onSavedRef.current?.(); }).current;

  useSessionAutoSave({
    song: songCtx.song,
    structure: songCtx.structure,
    title: songCtx.title,
    titleOrigin: songCtx.titleOrigin,
    topic: songCtx.topic,
    mood: songCtx.mood,
    rhymeScheme: songCtx.rhymeScheme,
    targetSyllables: songCtx.targetSyllables,
    songLanguage: songCtx.songLanguage,
    genre: songCtx.genre,
    tempo: songCtx.tempo,
    instrumentation: songCtx.instrumentation,
    rhythm: songCtx.rhythm,
    narrative: songCtx.narrative,
    musicalPrompt: songCtx.musicalPrompt,
    activeTab,
    isStructureOpen,
    isLeftPanelOpen,
    onSaved,
  });

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
          showBackdrop={showBackdrop(isMobileOrTablet)}
          isGenerating={isGenerating}
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
            hasSavedSession={hasSavedSession}
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

function AppProviders({ initialSession }: { initialSession: SessionSnapshot | null }) {
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

  const markupDirection = useMemo(
    () =>
      appState.markupText
        ? (/[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF]/.test(appState.markupText) ? 'rtl' : 'ltr')
        : 'ltr',
    [appState.markupText],
  );

  return (
    <EditorProvider
      editMode={appState.editMode}
      setEditMode={appState.setEditMode}
      markupText={appState.markupText}
      setMarkupText={appState.setMarkupText}
      markupTextareaRef={appState.markupTextareaRef}
      markupDirection={markupDirection}
    >
      <ErrorBoundary label="Analysis">
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
      </ErrorBoundary>
    </EditorProvider>
  );
}

function AppInner() {
  const [initialSession, setInitialSession] = useState<SessionSnapshot | null | undefined>(undefined);

  useEffect(() => {
    loadSession().then(setInitialSession).catch(() => setInitialSession(null));
  }, []);

  if (initialSession === undefined) return null;

  return (
    // initialSession passed to both providers so song + nav state are fully restored
    <AppStateProvider initialSession={initialSession}>
      <DragProvider>
        <SongProvider initialSession={initialSession}>
          <SongMutationProvider>
            <ComposerProvider>
              <VersionProvider>
                <SimilarityProvider>
                  <AppProviders initialSession={initialSession} />
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

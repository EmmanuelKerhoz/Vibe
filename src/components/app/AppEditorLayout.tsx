/**
 * AppEditorLayout
 * Shell: Left panel + Top ribbon + Editor zone + Right panel (conditional).
 *
 * Orchestrates exactly 2 hooks:
 *   - useEditorState    — all context reads + derived state
 *   - useEditorHandlers — all action/handler aggregation
 *
 * Props surface: 3 (isMobileOrTablet, playAudioFeedback, setIsStructureOpenAndClearLine)
 *
 * ComposerParamsProvider wraps the layout so that SongMetaForm (inside
 * LeftSettingsPanel) can source all song meta state without prop drilling.
 *
 * InsightsBarProvider is mounted here so that both InsightsBar and
 * AppEditorZone/LyricsView can consume isAnalyzing / isAdaptingLanguage /
 * targetLanguage without prop relay.
 */
import React, { Suspense, lazy, useMemo } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ErrorBoundary } from './ErrorBoundary';
import { useEditorState } from '../../hooks/useEditorState';
import { useEditorHandlers } from '../../hooks/useEditorHandlers';
import { useTranslation } from '../../i18n';
import { AppEditorZone } from './AppEditorZone';
import { ComposerParamsProvider } from '../../contexts/ComposerParamsContext';
import { InsightsBarProvider } from '../../contexts/InsightsBarContext';
import type { InsightsBarContextValue } from '../../contexts/InsightsBarContext';

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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        width: '100%',
      }}
    >
      <Spinner size="small" />
    </div>
  );
});

interface AppEditorLayoutProps {
  isMobileOrTablet: boolean;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => Promise<void>;
  /**
   * Single source of truth from AppInnerContent.
   * Clears selectedLineId whenever the structure panel is opened.
   */
  setIsStructureOpenAndClearLine: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export function AppEditorLayout({
  isMobileOrTablet,
  playAudioFeedback,
  setIsStructureOpenAndClearLine,
}: AppEditorLayoutProps) {
  const state = useEditorState();
  const handlers = useEditorHandlers({ state, isMobileOrTablet });

  const {
    // App state
    appState, hasApiKey, editMode,
    // Analysis
    isAnalyzing, isAdaptingLanguage, isDetectingLanguage,
    targetLanguage, setTargetLanguage,
    adaptSongLanguage, detectLanguage, analyzeCurrentSong,
    adaptationProgress, adaptationResult,
    canPasteLyrics,
    // Composer
    selectedLineId, setSelectedLineId, suggestions, isSuggesting,
    generateSuggestions, applySuggestion,
    // Derived
    webSimilarityIndex, webBadgeLabel, isSuggestionsOpen,
    // Panels
    linguisticsWorker, spellCheck,
    switchEditMode,
    // generateSong sourced from composerCtx via useEditorState
    generateSong,
    // Song (needed for AppEditorZone)
    song,
  } = state;

  const {
    isLeftPanelOpen, setIsLeftPanelOpen,
    isStructureOpen,
    libraryCount,
    isSectionDropdownOpen, setIsSectionDropdownOpen,
    setIsSimilarityModalOpen,
    isAnalysisPanelOpen,
  } = appState;

  const {
    handleGenerateSongFromLeftPanel,
    handleGlobalRegenerate,
    handleApiKeyHelp, handleOpenNewGeneration, handleCreateEmptySong,
    handleOpenPasteModal, handleOpenSaveToLibraryModal, handleOpenSearch,
    handleToggleAnalysisPanel,
    handleCloseAnalysisPanel, handleScrollToSection,
    addStructureItem, removeStructureItem, normalizeStructure,
  } = handlers;

  // ── InsightsBarContext value ──────────────────────────────────────────────
  // Memoized to prevent cascading re-renders on all InsightsBarContext consumers
  // whenever AppEditorLayout re-renders (e.g. on song edits propagated via SongContext).
  const insightsBarValue = useMemo<InsightsBarContextValue>(() => ({
    targetLanguage,
    setTargetLanguage,
    isAdaptingLanguage,
    isDetectingLanguage,
    adaptSongLanguage,
    detectLanguage,
    adaptationProgress,
    adaptationResult: adaptationResult ?? null,
    isAnalyzing,
    analyzeCurrentSong,
    editMode,
    switchEditMode,
    webSimilarityIndex,
    webBadgeLabel,
    setIsSimilarityModalOpen,
    libraryCount,
    onOpenSearch: handleOpenSearch,
    onToggleAnalysisPanel: handleToggleAnalysisPanel,
    isAnalysisPanelOpen,
    hasApiKey,
  }), [
    targetLanguage, setTargetLanguage,
    isAdaptingLanguage, isDetectingLanguage,
    adaptSongLanguage, detectLanguage,
    adaptationProgress, adaptationResult,
    isAnalyzing, analyzeCurrentSong,
    editMode, switchEditMode,
    webSimilarityIndex, webBadgeLabel,
    setIsSimilarityModalOpen, libraryCount,
    handleOpenSearch, handleToggleAnalysisPanel,
    isAnalysisPanelOpen, hasApiKey,
  ]);

  return (
    <ComposerParamsProvider>
      <InsightsBarProvider value={insightsBarValue}>
        {/*
          lcars-lyrics-area is placed on the flex row parent so that the
          textured background shows through the rounded corners of the
          right panels (StructureSidebar, SuggestionsPanel, AnalysisPanel).
          min-h-0 prevents flex-1 from overflowing and pushing the StatusBar.
        */}
        <div className="flex-1 flex overflow-hidden min-h-0 lcars-lyrics-area">
          {/* ── Left panel ──────────────────────────────────────────────────── */}
          <ErrorBoundary label="Left panel">
            <Suspense fallback={<LazyFallback />}>
              <LeftSettingsPanel
                isMobileOverlay={isMobileOrTablet}
                isLeftPanelOpen={isLeftPanelOpen}
                setIsLeftPanelOpen={setIsLeftPanelOpen}
                onGenerateSong={handleGenerateSongFromLeftPanel}
                onRegenerateSong={handleGlobalRegenerate}
              />
            </Suspense>
          </ErrorBoundary>

          {/* ── Center column ───────────────────────────────────────────────── */}
          {/*
            bg-fluent-bg keeps the editor zone background independent from
            the textured row parent — the texture should only show through
            at the rounded panel corners, not flood the editor area.
          */}
          <div className="flex-1 flex flex-col min-w-0 bg-fluent-bg relative">
            {/* Ambient glow — max-w-full prevents overflow on mobile viewports */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded" />

            <ErrorBoundary label="Top ribbon">
              <Suspense fallback={<LazyFallback />}>
                <TopRibbon
                  hasApiKey={hasApiKey}
                  handleApiKeyHelp={handleApiKeyHelp}
                  onOpenNewGeneration={handleOpenNewGeneration}
                  onOpenNewEmpty={handleCreateEmptySong}
                />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary label="Editor zone">
              <AppEditorZone
                activeTab={appState.activeTab}
                isMobileOrTablet={isMobileOrTablet}
                hasApiKey={hasApiKey}
                songHasContent={song.length > 0}
                playAudioFeedback={playAudioFeedback}
                canPasteLyrics={canPasteLyrics}
                onOpenLibrary={handleOpenSaveToLibraryModal}
                onPasteLyrics={handleOpenPasteModal}
                onGenerateSong={handleGlobalRegenerate}
                onOpenSearch={handleOpenSearch}
              />
            </ErrorBoundary>
          </div>

          {/* ── Right panel (conditional) ────────────────────────────────────── */}
          <ErrorBoundary label="Right panel">
            <Suspense fallback={<LazyFallback />}>
              {isAnalysisPanelOpen ? (
                <AnalysisPanel
                  result={linguisticsWorker.result}
                  isComputing={linguisticsWorker.isComputing}
                  error={linguisticsWorker.error}
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
                  isStructureOpen={isStructureOpen}
                  setIsStructureOpen={setIsStructureOpenAndClearLine}
                  isSectionDropdownOpen={isSectionDropdownOpen}
                  setIsSectionDropdownOpen={setIsSectionDropdownOpen}
                  addStructureItem={addStructureItem}
                  removeStructureItem={removeStructureItem}
                  normalizeStructure={normalizeStructure}
                  onScrollToSection={handleScrollToSection}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
      </InsightsBarProvider>
    </ComposerParamsProvider>
  );
}

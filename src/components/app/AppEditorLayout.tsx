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
 */
import React, { Suspense, lazy } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ErrorBoundary } from './ErrorBoundary';
import { useEditorState } from '../../hooks/useEditorState';
import { useEditorHandlers } from '../../hooks/useEditorHandlers';
import { useTranslation } from '../../i18n';
import { AppEditorZone } from './AppEditorZone';
import { ComposerParamsProvider } from '../../contexts/ComposerParamsContext';

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
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
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
    // Left panel layout-intent callbacks
    handleGenerateSongFromLeftPanel,
    handleGlobalRegenerate,
    // Top ribbon
    handleApiKeyHelp, handleOpenNewGeneration, handleCreateEmptySong,
    // Editor zone
    handleOpenPasteModal, handleOpenSaveToLibraryModal, handleOpenSearch,
    handleToggleAnalysisPanel,
    // Right panels
    handleCloseAnalysisPanel, handleScrollToSection,
    addStructureItem, removeStructureItem,
  } = handlers;

  return (
    <ComposerParamsProvider>
      <div className="flex-1 flex overflow-hidden">
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
        <div className="flex-1 flex flex-col min-w-0 bg-fluent-bg relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded" />

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

          {/* ErrorBoundary added: LyricsView / InsightsBar were the only
              critical zones without crash isolation. A malformed song or
              worker error could silently take down the entire center column. */}
          <ErrorBoundary label="Editor zone">
            <AppEditorZone
              activeTab={appState.activeTab}
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
                isStructureOpen={isStructureOpen}
                setIsStructureOpen={setIsStructureOpenAndClearLine}
                isSectionDropdownOpen={isSectionDropdownOpen}
                setIsSectionDropdownOpen={setIsSectionDropdownOpen}
                addStructureItem={addStructureItem}
                removeStructureItem={removeStructureItem}
                onScrollToSection={handleScrollToSection}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </ComposerParamsProvider>
  );
}

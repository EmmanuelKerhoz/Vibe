/**
 * AppEditorZone
 * Renders the central content area: InsightsBar (conditional) + the scrollable
 * lyrics/musical zone. Receives only the props it cannot source from contexts
 * to avoid re-wiring everything that is already context-available downstream.
 *
 * Each major zone (InsightsBar, LyricsView, MusicalTab) is wrapped in its own
 * <ErrorBoundary> so a crash in one zone never takes down the others.
 *
 * Editor state (editMode, markupText, markupTextareaRef, markupDirection,
 * setEditMode, setMarkupText) is no longer passed here — LyricsView sources
 * it directly from EditorContext.
 *
 * Drag handlers (handleDrop, handleLineDragStart, handleLineDrop) are no longer
 * passed here — LyricsView and SectionEditor source them from DragHandlersContext.
 */
import React, { Suspense, lazy } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ErrorBoundary } from './ErrorBoundary';
import { InsightsBar } from './InsightsBar';
import { LyricsView } from './LyricsView';
import { useAudioFeedback } from '../../hooks/useAudioFeedback';
import { useTranslation } from '../../i18n';
import { useTranslationAdaptationContext } from '../../contexts/TranslationAdaptationContext';
import type { EditMode } from '../../types';
import type { WebSimilarityIndex } from '../../types/webSimilarity';
import type { AdaptationProgress, AdaptationResult } from '../../hooks/analysis/useLanguageAdapter';

const MusicalTab = lazy(() =>
  import('./musical/MusicalTab').then(m => ({ default: m.MusicalTab }))
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

type PlayAudioFeedback = ReturnType<typeof useAudioFeedback>['playAudioFeedback'];

interface AppEditorZoneProps {
  // Layout
  activeTab: 'lyrics' | 'musical';
  isMobileOrTablet: boolean;
  hasApiKey: boolean;
  songHasContent: boolean;
  // InsightsBar
  targetLanguage: string;
  setTargetLanguage: (v: string) => void;
  isAdaptingLanguage: boolean;
  isDetectingLanguage: boolean;
  isAnalyzing: boolean;
  editMode: EditMode;
  switchEditMode: (mode: EditMode) => void;
  webSimilarityIndex: WebSimilarityIndex;
  webBadgeLabel: string | null;
  libraryCount: number;
  adaptSongLanguage: (newLanguage: string) => void;
  detectLanguage: () => void;
  analyzeCurrentSong: () => void;
  setIsSimilarityModalOpen: (v: boolean) => void;
  adaptationProgress: AdaptationProgress;
  adaptationResult: AdaptationResult | null;
  // LyricsView
  playAudioFeedback: PlayAudioFeedback;
  canPasteLyrics: boolean;
  onOpenLibrary: () => void;
  onPasteLyrics: () => void;
  onGenerateSong: () => void;
}

export function AppEditorZone({
  activeTab, isMobileOrTablet, hasApiKey, songHasContent,
  targetLanguage, setTargetLanguage,
  isAdaptingLanguage, isDetectingLanguage, isAnalyzing,
  editMode, switchEditMode, webSimilarityIndex, webBadgeLabel,
  libraryCount, adaptSongLanguage, detectLanguage, analyzeCurrentSong,
  setIsSimilarityModalOpen, adaptationProgress, adaptationResult,
  playAudioFeedback,
  canPasteLyrics, onOpenLibrary, onPasteLyrics, onGenerateSong,
}: AppEditorZoneProps) {
  const { showTranslationFeatures } = useTranslationAdaptationContext();

  return (
    <>
      {activeTab === 'lyrics' && songHasContent && (
        <ErrorBoundary label="Insights">
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
        </ErrorBoundary>
      )}

      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative lcars-lyrics-area ${
          isMobileOrTablet ? 'p-2' : 'p-4 lg:p-8'
        }`}
        style={isMobileOrTablet ? { paddingBottom: 'calc(60px + var(--sab))' } : undefined}
      >
        <div className="lyrics-editor-zoom-wrapper">
          <div className="lyrics-editor-zoom">
            {activeTab === 'lyrics' ? (
              <ErrorBoundary label="Lyrics editor">
                <LyricsView
                  isAnalyzing={isAnalyzing}
                  isAdaptingLanguage={isAdaptingLanguage}
                  playAudioFeedback={playAudioFeedback}
                  canPasteLyrics={canPasteLyrics}
                  targetLanguage={targetLanguage}
                  onOpenLibrary={onOpenLibrary}
                  onPasteLyrics={onPasteLyrics}
                  onGenerateSong={onGenerateSong}
                />
              </ErrorBoundary>
            ) : (
              <ErrorBoundary label="Musical tab">
                <Suspense fallback={<LazyFallback />}>
                  <MusicalTab hasApiKey={hasApiKey} />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * AppEditorZone
 * Renders the central content area: InsightsBar (conditional) + the scrollable
 * lyrics/musical zone.
 *
 * Props surface: 6 (down from 23).
 * InsightsBar now sources all its state from InsightsBarContext.
 * LyricsView sources editor state from EditorContext.
 * Drag handlers are sourced from DragHandlersContext.
 */
import React, { Suspense, lazy } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ErrorBoundary } from './ErrorBoundary';
import { InsightsBar } from './InsightsBar';
import { LyricsView } from './LyricsView';
import { useAudioFeedback } from '../../hooks/useAudioFeedback';
import { useTranslation } from '../../i18n';

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
  activeTab: 'lyrics' | 'musical';
  isMobileOrTablet: boolean;
  hasApiKey: boolean;
  songHasContent: boolean;
  playAudioFeedback: PlayAudioFeedback;
  canPasteLyrics: boolean;
  onOpenLibrary: () => void;
  onPasteLyrics: () => void;
  onGenerateSong: () => void;
  onOpenSearch: () => void;
}

export function AppEditorZone({
  activeTab,
  isMobileOrTablet,
  hasApiKey,
  songHasContent,
  playAudioFeedback,
  canPasteLyrics,
  onOpenLibrary,
  onPasteLyrics,
  onGenerateSong,
  onOpenSearch,
}: AppEditorZoneProps) {
  return (
    <>
      {activeTab === 'lyrics' && songHasContent && (
        <ErrorBoundary label="Insights">
          <InsightsBar />
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
                  hasApiKey={hasApiKey}
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

/**
 * AppEditorZone
 * Renders the central content area: InsightsBar (conditional) + the scrollable
 * lyrics/musical zone. Receives only the props it cannot source from contexts
 * to avoid re-wiring everything that is already context-available downstream.
 */
import React, { Suspense, lazy } from 'react';
import { Spinner } from '@fluentui/react-components';
import { ErrorBoundary } from './ErrorBoundary';
import { InsightsBar } from './InsightsBar';
import { LyricsView } from './LyricsView';
import { useAudioFeedback } from '../../hooks/useAudioFeedback';
import { useTranslation } from '../../i18n';
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
  webBadgeLabel: string;
  libraryCount: number;
  adaptSongLanguage: (newLanguage: string) => void;
  detectLanguage: () => void;
  analyzeCurrentSong: () => void;
  setIsSimilarityModalOpen: (v: boolean) => void;
  adaptationProgress: AdaptationProgress;
  adaptationResult: AdaptationResult | null;
  showTranslationFeatures: boolean;
  // LyricsView
  playAudioFeedback: PlayAudioFeedback;
  handleDrop: (e: React.DragEvent) => void;
  handleLineDragStart: (lineId: string, sectionId: string) => void;
  handleLineDrop: (targetSectionId: string, targetLineId: string | null) => void;
  setEditMode: (v: EditMode) => void;
  markupText: string;
  setMarkupText: (v: string) => void;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  markupDirection: 'ltr' | 'rtl';
  canPasteLyrics: boolean;
  onOpenLibrary: () => void;
  onPasteLyrics: () => void;
  onGenerateSong: () => void;
  sectionTargetLanguages: Record<string, string>;
  onSectionTargetLanguageChange: (sectionId: string, lang: string) => void;
  adaptSectionLanguage: (sectionId: string, newLanguage: string) => void;
  adaptLineLanguage: (sectionId: string, lineId: string, newLanguage: string) => void;
  adaptingLineIds: Set<string>;
}

export function AppEditorZone({
  activeTab, isMobileOrTablet, hasApiKey, songHasContent,
  targetLanguage, setTargetLanguage,
  isAdaptingLanguage, isDetectingLanguage, isAnalyzing,
  editMode, switchEditMode, webSimilarityIndex, webBadgeLabel,
  libraryCount, adaptSongLanguage, detectLanguage, analyzeCurrentSong,
  setIsSimilarityModalOpen, adaptationProgress, adaptationResult,
  showTranslationFeatures,
  playAudioFeedback, handleDrop, handleLineDragStart, handleLineDrop,
  setEditMode, markupText, setMarkupText, markupTextareaRef, markupDirection,
  canPasteLyrics, onOpenLibrary, onPasteLyrics, onGenerateSong,
  sectionTargetLanguages, onSectionTargetLanguageChange,
  adaptSectionLanguage, adaptLineLanguage, adaptingLineIds,
}: AppEditorZoneProps) {
  return (
    <>
      {activeTab === 'lyrics' && songHasContent && (
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
        className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative lcars-lyrics-area ${
          isMobileOrTablet ? 'p-2' : 'p-4 lg:p-8'
        }`}
        style={isMobileOrTablet ? { paddingBottom: 'calc(60px + var(--sab))' } : undefined}
      >
        <div className="lyrics-editor-zoom-wrapper">
          <div className="lyrics-editor-zoom">
            {activeTab === 'lyrics' ? (
              <LyricsView
                isAnalyzing={isAnalyzing}
                isAdaptingLanguage={isAdaptingLanguage}
                sectionTargetLanguages={sectionTargetLanguages}
                onSectionTargetLanguageChange={onSectionTargetLanguageChange}
                adaptSectionLanguage={adaptSectionLanguage}
                adaptLineLanguage={adaptLineLanguage}
                adaptingLineIds={adaptingLineIds}
                playAudioFeedback={playAudioFeedback}
                handleDrop={handleDrop}
                handleLineDragStart={handleLineDragStart}
                handleLineDrop={handleLineDrop}
                editMode={editMode} setEditMode={setEditMode}
                markupText={markupText} setMarkupText={setMarkupText}
                markupTextareaRef={markupTextareaRef}
                markupDirection={markupDirection}
                canPasteLyrics={canPasteLyrics}
                targetLanguage={targetLanguage}
                onOpenLibrary={onOpenLibrary}
                onPasteLyrics={onPasteLyrics}
                onGenerateSong={onGenerateSong}
                showTranslationFeatures={showTranslationFeatures}
              />
            ) : (
              <ErrorBoundary>
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

import React from 'react';
import { getLanguageDisplay } from '../../i18n';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { AdaptationProgressBanner } from './AdaptationProgressBanner';
import {
  InsightsBarLayout,
  InsightsActions,
  MetronomeButton,
  MobileKpis,
  ViewModeSelector,
  useAdaptationBannerVisibility,
} from './insights';
import type { InsightsBarProps } from './insights/InsightsBar.types';

export const InsightsBar = React.memo(function InsightsBar({
  targetLanguage,
  setTargetLanguage,
  isAdaptingLanguage,
  isDetectingLanguage,
  isAnalyzing,
  editMode,
  switchEditMode,
  webSimilarityIndex,
  webBadgeLabel,
  libraryCount,
  adaptSongLanguage,
  detectLanguage,
  analyzeCurrentSong,
  setIsSimilarityModalOpen,
  hasApiKey,
  isMetronomeActive,
  toggleMetronome,
  adaptationProgress,
  adaptationResult,
  showTranslationFeatures = true,
}: InsightsBarProps) {
  const { song, songLanguage, detectedLanguages } = useSongContext();
  const { isGenerating } = useComposerContext();
  const { showBanner, dismissBanner } = useAdaptationBannerVisibility(adaptationProgress);
  const hasLyrics = song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0));
  const detectedDisplays = (detectedLanguages.length > 0 ? detectedLanguages : (songLanguage ? [songLanguage] : [])).map(getLanguageDisplay);

  return (
    <InsightsBarLayout
      viewSelector={<ViewModeSelector editMode={editMode} switchEditMode={switchEditMode} disabled={isGenerating || isAnalyzing} />}
      translationControls={null}
      metronomeControl={<MetronomeButton isMetronomeActive={isMetronomeActive} toggleMetronome={toggleMetronome} />}
      insightsActions={
        <InsightsActions
          webSimilarityIndex={webSimilarityIndex}
          webBadgeLabel={webBadgeLabel}
          libraryCount={libraryCount}
          isDetectingLanguage={isDetectingLanguage}
          isAnalyzing={isAnalyzing}
          isGenerating={isGenerating}
          hasLyrics={hasLyrics}
          detectedDisplays={detectedDisplays}
          detectLanguage={detectLanguage}
          analyzeCurrentSong={analyzeCurrentSong}
          setIsSimilarityModalOpen={setIsSimilarityModalOpen}
          hasApiKey={hasApiKey}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          isAdaptingLanguage={isAdaptingLanguage}
          adaptSongLanguage={adaptSongLanguage}
          showTranslationFeatures={showTranslationFeatures}
          song={song}
        />
      }
      mobileKpis={<MobileKpis />}
      banner={showBanner && adaptationProgress ? <AdaptationProgressBanner progress={adaptationProgress} result={adaptationResult ?? null} onDismiss={dismissBanner} isOverlay /> : null}
    />
  );
});

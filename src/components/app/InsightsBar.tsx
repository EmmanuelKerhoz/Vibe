import React from 'react';
import { getLanguageDisplay } from '../../i18n';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useAppKpis } from '../../hooks/useAppKpis';
import { AdaptationProgressBanner } from './AdaptationProgressBanner';
import {
  InsightsBarLayout,
  InsightsActions,
  MetronomeButton,
  MobileKpisDisplay,
  TranslateGroup,
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
  isMetronomeActive,
  toggleMetronome,
  adaptationProgress,
  adaptationResult,
  showTranslationFeatures = true,
}: InsightsBarProps) {
  const { song, songLanguage, detectedLanguages } = useSongContext();
  const { isGenerating } = useComposerContext();
  const { sectionCount, wordCount, charCount } = useAppKpis();
  const { showBanner, dismissBanner } = useAdaptationBannerVisibility(adaptationProgress);
  const hasLyrics = song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0));
  const detectedDisplays = (detectedLanguages.length > 0 ? detectedLanguages : (songLanguage ? [songLanguage] : []))
    .map(getLanguageDisplay);

  return (
    <InsightsBarLayout
      viewSelector={<ViewModeSelector editMode={editMode} switchEditMode={switchEditMode} disabled={isGenerating || isAnalyzing} />}
      translationControls={
        <TranslateGroup
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          isAdaptingLanguage={isAdaptingLanguage}
          song={song}
          adaptSongLanguage={adaptSongLanguage}
          showTranslationFeatures={showTranslationFeatures}
        />
      }
      metronomeControl={<MetronomeButton isMetronomeActive={isMetronomeActive} toggleMetronome={toggleMetronome} />}
      insightsActions={<InsightsActions webSimilarityIndex={webSimilarityIndex} webBadgeLabel={webBadgeLabel} libraryCount={libraryCount} isDetectingLanguage={isDetectingLanguage} isAnalyzing={isAnalyzing} isGenerating={isGenerating} hasLyrics={hasLyrics} detectedDisplays={detectedDisplays} detectLanguage={detectLanguage} analyzeCurrentSong={analyzeCurrentSong} setIsSimilarityModalOpen={setIsSimilarityModalOpen} />}
      mobileKpis={<MobileKpisDisplay sectionCount={sectionCount} wordCount={wordCount} charCount={charCount} />}
      banner={showBanner && adaptationProgress
        ? <AdaptationProgressBanner progress={adaptationProgress} result={adaptationResult ?? null} onDismiss={dismissBanner} isOverlay />
        : null}
    />
  );
});

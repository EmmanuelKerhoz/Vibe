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
  TranslateGroup,
  ViewModeSelector,
  useAdaptationBannerVisibility,
} from './insights';
import { DetectLanguageButton } from './insights/DetectLanguageButton';
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
  onOpenSearch = () => {},
  onToggleAnalysisPanel,
  isAnalysisPanelOpen,
}: InsightsBarProps) {
  const { song, songLanguage, detectedLanguages } = useSongContext();
  const { isGenerating } = useComposerContext();
  const { showBanner, dismissBanner } = useAdaptationBannerVisibility(adaptationProgress);
  const hasLyrics = song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0));
  const detectedDisplays = (detectedLanguages.length > 0 ? detectedLanguages : (songLanguage ? [songLanguage] : []))
    .filter((lang, i, arr) => arr.indexOf(lang) === i)
    .slice(0, 3)
    .map(getLanguageDisplay);

  return (
    <InsightsBarLayout
      viewSelector={<ViewModeSelector editMode={editMode} switchEditMode={switchEditMode} disabled={isGenerating || isAnalyzing} />}
      detectControl={<DetectLanguageButton detectedDisplays={detectedDisplays} hasLyrics={hasLyrics} isDetectingLanguage={isDetectingLanguage} onDetect={detectLanguage} hasApiKey={hasApiKey} />}
      translationControls={<TranslateGroup targetLanguage={targetLanguage} setTargetLanguage={setTargetLanguage} isAdaptingLanguage={isAdaptingLanguage} song={song} adaptSongLanguage={adaptSongLanguage} showTranslationFeatures={showTranslationFeatures} hasApiKey={hasApiKey} />}
      metronomeControl={<MetronomeButton isMetronomeActive={isMetronomeActive} toggleMetronome={toggleMetronome} />}
      insightsActions={<InsightsActions webSimilarityIndex={webSimilarityIndex} webBadgeLabel={webBadgeLabel} libraryCount={libraryCount} isAnalyzing={isAnalyzing} isGenerating={isGenerating} hasLyrics={hasLyrics} detectedDisplays={detectedDisplays} analyzeCurrentSong={analyzeCurrentSong} setIsSimilarityModalOpen={setIsSimilarityModalOpen} hasApiKey={hasApiKey} onOpenSearch={onOpenSearch} onToggleAnalysisPanel={onToggleAnalysisPanel} isAnalysisPanelOpen={isAnalysisPanelOpen} />}
      mobileKpis={<MobileKpis />}
      banner={showBanner && adaptationProgress ? <AdaptationProgressBanner progress={adaptationProgress} result={adaptationResult ?? null} onDismiss={dismissBanner} isOverlay /> : null}
    />
  );
});

import React from 'react';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useAppKpis } from '../../hooks/useAppKpis';
import { AdaptationProgressBanner } from './AdaptationProgressBanner';
import {
  AnalyzeSongButton,
  DetectLanguageButton,
  InsightsBarLayout,
  MetronomeButton,
  MobileKpisDisplay,
  SimilarityButton,
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
      insightsActions={
        <>
          <DetectLanguageButton detectedLanguages={detectedLanguages} songLanguage={songLanguage} songCount={song.length} isDetectingLanguage={isDetectingLanguage} onDetect={detectLanguage} />
          <AnalyzeSongButton isGenerating={isGenerating} isAnalyzing={isAnalyzing} songCount={song.length} onAnalyze={analyzeCurrentSong} />
          <SimilarityButton isGenerating={isGenerating} isAnalyzing={isAnalyzing} hasLyrics={hasLyrics} webSimilarityIndex={webSimilarityIndex} webBadgeLabel={webBadgeLabel} libraryCount={libraryCount} setIsSimilarityModalOpen={setIsSimilarityModalOpen} />
        </>
      }
      mobileKpis={<MobileKpisDisplay sectionCount={sectionCount} wordCount={wordCount} charCount={charCount} />}
      banner={showBanner && adaptationProgress
        ? <AdaptationProgressBanner progress={adaptationProgress} result={adaptationResult ?? null} onDismiss={dismissBanner} isOverlay />
        : null}
    />
  );
});

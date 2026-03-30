import React from 'react';
import type { useSimilarityEngine } from '../../hooks/useSimilarityEngine';
import type { AdaptationProgress, AdaptationResult } from '../../hooks/analysis/useLanguageAdapter';
import type { EditMode } from '../../types';
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
  TranslationControls,
  ViewModeSelector,
} from './insights';

interface InsightsBarProps {
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isAdaptingLanguage: boolean;
  isDetectingLanguage: boolean;
  isAnalyzing: boolean;
  editMode: EditMode;
  switchEditMode: (target: EditMode) => void;
  webSimilarityIndex: ReturnType<typeof useSimilarityEngine>['index'];
  webBadgeLabel: string | null;
  libraryCount: number;
  adaptSongLanguage: (lang: string) => void;
  detectLanguage: () => void;
  analyzeCurrentSong: () => void;
  setIsSimilarityModalOpen: (open: boolean) => void;
  isMetronomeActive?: boolean;
  toggleMetronome?: () => void;
  adaptationProgress?: AdaptationProgress;
  adaptationResult?: AdaptationResult | null;
  showTranslationFeatures?: boolean;
}

// ---------------------------------------------------------------------------
// InsightsBar
// ---------------------------------------------------------------------------

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
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  React.useEffect(() => {
    if (adaptationProgress && adaptationProgress.active !== 'idle') {
      setBannerDismissed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptationProgress?.active]);

  const hasLyrics = song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0));

  const showBanner = !!adaptationProgress &&
    adaptationProgress.active !== 'idle' &&
    !bannerDismissed;

  return (
    <InsightsBarLayout
      viewSelector={<ViewModeSelector editMode={editMode} switchEditMode={switchEditMode} disabled={isGenerating || isAnalyzing} />}
      translationControls={
        <TranslationControls
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          isAdaptingLanguage={isAdaptingLanguage}
          songCount={song.length}
          adaptSongLanguage={adaptSongLanguage}
          showTranslationFeatures={showTranslationFeatures}
        />
      }
      metronomeControl={<MetronomeButton isActive={isMetronomeActive} onToggle={toggleMetronome} />}
      insightsActions={
        <>
          <DetectLanguageButton detectedLanguages={detectedLanguages} songLanguage={songLanguage} songCount={song.length} isDetectingLanguage={isDetectingLanguage} onDetect={detectLanguage} />
          <AnalyzeSongButton isGenerating={isGenerating} isAnalyzing={isAnalyzing} songCount={song.length} onAnalyze={analyzeCurrentSong} />
          <SimilarityButton isGenerating={isGenerating} isAnalyzing={isAnalyzing} hasLyrics={hasLyrics} webSimilarityIndex={webSimilarityIndex} webBadgeLabel={webBadgeLabel} libraryCount={libraryCount} setIsSimilarityModalOpen={setIsSimilarityModalOpen} />
        </>
      }
      mobileKpis={<MobileKpisDisplay sectionCount={sectionCount} wordCount={wordCount} charCount={charCount} />}
      banner={showBanner && adaptationProgress
        ? <AdaptationProgressBanner progress={adaptationProgress} result={adaptationResult ?? null} onDismiss={() => setBannerDismissed(true)} isOverlay />
        : null}
    />
  );
});

import React from 'react';
import { getLanguageDisplay, SUPPORTED_ADAPTATION_LANGUAGES } from '../../i18n';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useInsightsBarContext } from '../../contexts/InsightsBarContext';
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
import { useTranslationAdaptationContext } from '../../contexts/TranslationAdaptationContext';

export const InsightsBar = React.memo(function InsightsBar() {
  const {
    targetLanguage, setTargetLanguage,
    isAdaptingLanguage, isDetectingLanguage, isAnalyzing,
    editMode, switchEditMode,
    webBadgeLabel, libraryCount,
    adaptSongLanguage, detectLanguage, analyzeCurrentSong,
    setIsSimilarityModalOpen, hasApiKey,
    isMetronomeActive, toggleMetronome,
    adaptationProgress, adaptationResult,
    onOpenSearch, onToggleAnalysisPanel, isAnalysisPanelOpen,
  } = useInsightsBarContext();

  const { song, songLanguage, setSongLanguage, detectedLanguages } = useSongContext();
  const { isGenerating } = useComposerContext();
  const { showTranslationFeatures } = useTranslationAdaptationContext();
  const { showBanner, dismissBanner } = useAdaptationBannerVisibility(adaptationProgress);

  const hasLyrics = song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0));
  const detectedDisplays = (detectedLanguages.length > 0 ? detectedLanguages : (songLanguage ? [songLanguage] : []))
    .filter((lang, i, arr) => arr.indexOf(lang) === i)
    .slice(0, 3)
    .map(getLanguageDisplay);

  /**
   * Called when the user picks a default generation language in no-lyrics mode.
   * Receives the lang.code (e.g. "SA") and resolves it to the aiName (e.g. "Sanskrit")
   * that useAiGeneration expects in its prompt.
   */
  const handleSetDefaultLanguage = (langCode: string) => {
    const match = SUPPORTED_ADAPTATION_LANGUAGES.find(
      l => l.code.toLowerCase() === langCode.toLowerCase(),
    );
    const aiName = match?.aiName ?? langCode;
    setSongLanguage(aiName);
  };

  // The defaultLanguage prop is used by DetectLanguageButton to show a checkmark
  // next to the currently selected language. It expects a lang.code (lowercase).
  const songLanguageCode = (() => {
    if (!songLanguage) return undefined;
    const match = SUPPORTED_ADAPTATION_LANGUAGES.find(
      l => l.aiName.toLowerCase() === songLanguage.toLowerCase(),
    );
    return match ? match.code.toLowerCase() : undefined;
  })();

  // exactOptionalPropertyTypes: only spread optional props when value is defined
  const metronomeOptional = {
    ...(isMetronomeActive !== undefined ? { isMetronomeActive } : {}),
    ...(toggleMetronome !== undefined ? { toggleMetronome } : {}),
  };

  // exactOptionalPropertyTypes: defaultLanguage must be string, not string | undefined
  const defaultLanguageOptional = songLanguageCode !== undefined
    ? { defaultLanguage: songLanguageCode }
    : {};

  return (
    <InsightsBarLayout
      viewSelector={<ViewModeSelector editMode={editMode} switchEditMode={switchEditMode} disabled={isGenerating || isAnalyzing} />}
      detectControl={
        <DetectLanguageButton
          detectedDisplays={detectedDisplays}
          hasLyrics={hasLyrics}
          isDetectingLanguage={isDetectingLanguage}
          onDetect={detectLanguage}
          hasApiKey={hasApiKey}
          onSetDefaultLanguage={handleSetDefaultLanguage}
          {...defaultLanguageOptional}
        />
      }
      translationControls={<TranslateGroup targetLanguage={targetLanguage} setTargetLanguage={setTargetLanguage} isAdaptingLanguage={isAdaptingLanguage} song={song} adaptSongLanguage={adaptSongLanguage} showTranslationFeatures={showTranslationFeatures} hasApiKey={hasApiKey} />}
      metronomeControl={<MetronomeButton {...metronomeOptional} />}
      insightsActions={<InsightsActions webBadgeLabel={webBadgeLabel} libraryCount={libraryCount} isAnalyzing={isAnalyzing} isGenerating={isGenerating} hasLyrics={hasLyrics} detectedDisplays={detectedDisplays} analyzeCurrentSong={analyzeCurrentSong} setIsSimilarityModalOpen={setIsSimilarityModalOpen} hasApiKey={hasApiKey} onOpenSearch={onOpenSearch} onToggleAnalysisPanel={onToggleAnalysisPanel} isAnalysisPanelOpen={isAnalysisPanelOpen} />}
      mobileKpis={<MobileKpis />}
      banner={showBanner && adaptationProgress ? <AdaptationProgressBanner progress={adaptationProgress} result={adaptationResult ?? null} onDismiss={dismissBanner} isOverlay /> : null}
    />
  );
});

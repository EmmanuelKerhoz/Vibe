import React, { useCallback, useMemo } from 'react';
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

  // Resolve aiName strings from detectedLanguages to canonical langIds before
  // calling getLanguageDisplay, avoiding the LEGACY_INDEX ambiguity between
  // ui: and adapt: entries that share the same normalised aiName/label.
  const detectedDisplays = (detectedLanguages.length > 0 ? detectedLanguages : (songLanguage ? [songLanguage] : []))
    .filter((lang, i, arr) => arr.indexOf(lang) === i)
    .slice(0, 3)
    .map(lang => {
      const match = SUPPORTED_ADAPTATION_LANGUAGES.find(
        l => l.aiName.toLowerCase() === lang.toLowerCase(),
      );
      return getLanguageDisplay(match?.langId ?? lang);
    });

  /**
   * Fix #5 — memoized: the find() only re-runs when songLanguage changes.
   * Returns the canonical langId (e.g. "adapt:FR") for DetectLanguageButton's
   * checkmark display. Using langId instead of bare code prevents LEGACY_INDEX
   * collisions between ui: and adapt: namespaces.
   */
  const songLanguageCode = useMemo(() => {
    if (!songLanguage) return undefined;
    const match = SUPPORTED_ADAPTATION_LANGUAGES.find(
      l => l.aiName.toLowerCase() === songLanguage.toLowerCase(),
    );
    return match ? match.langId : undefined;
  }, [songLanguage]);

  /**
   * Fix #5 — memoized: the find() only re-runs when setSongLanguage identity
   * changes (stable context ref — effectively once per mount).
   * Receives lang.code (e.g. "SA") and resolves to aiName (e.g. "Sanskrit")
   * that useAiGeneration expects in its prompt.
   */
  const handleSetDefaultLanguage = useCallback((langCode: string) => {
    const match = SUPPORTED_ADAPTATION_LANGUAGES.find(
      l => l.code.toLowerCase() === langCode.toLowerCase(),
    );
    const aiName = match?.aiName ?? langCode;
    setSongLanguage(aiName);
  }, [setSongLanguage]);

  /**
   * exactOptionalPropertyTypes guard: MetronomeButton declares isMetronomeActive
   * and toggleMetronome as `?: T`. Passing `prop={undefined}` is a TS error —
   * the conditional spread omits the key entirely when the value is undefined.
   */
  const metronomeOptional = {
    ...(isMetronomeActive !== undefined ? { isMetronomeActive } : {}),
    ...(toggleMetronome !== undefined ? { toggleMetronome } : {}),
  };

  /**
   * exactOptionalPropertyTypes guard: DetectLanguageButton declares
   * defaultLanguage as `?: string`. Same rationale as above.
   */
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

import React from 'react';
import { Loader2, BarChart2, Languages, ScanText, Search, Timer } from '../ui/icons';
import { LcarsSelect } from '../ui/LcarsSelect';
import { Tooltip } from '../ui/Tooltip';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES, getLanguageDisplay } from '../../i18n';
import type { useSimilarityEngine } from '../../hooks/useSimilarityEngine';
import type { AdaptationProgress, AdaptationResult } from '../../hooks/analysis/useLanguageAdapter';
import type { EditMode } from '../../types';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useAppKpis } from '../../hooks/useAppKpis';
import { AdaptationProgressBanner } from './AdaptationProgressBanner';
import { ViewModeSelector } from './insights';

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
// Static language options — built once at module level so EmojiSign instances
// are never remounted due to a new options array reference on each render.
// ---------------------------------------------------------------------------

const LANGUAGE_SELECT_OPTIONS = SUPPORTED_ADAPTATION_LANGUAGES.map(lang => ({
  value: lang.aiName,
  label: (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      <EmojiSign sign={lang.sign} />
      <span className="truncate">{lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}</span>
    </span>
  ),
}));

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
  const { t } = useTranslation();
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  React.useEffect(() => {
    if (adaptationProgress && adaptationProgress.active !== 'idle') {
      setBannerDismissed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptationProgress?.active]);

  const targetDisplay = getLanguageDisplay(targetLanguage);
  const detectedDisplays = (detectedLanguages.length > 0 ? detectedLanguages : (songLanguage ? [songLanguage] : []))
    .map(lang => getLanguageDisplay(lang));
  const targetLanguageDisplayText = targetDisplay ? `${targetDisplay.sign} ${targetDisplay.label}` : targetLanguage;

  const hasLyrics = song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0));

  const detectedLanguageList = detectedDisplays.slice(0, 3).map(d => `${d.sign} ${d.label}`).join(', ');

  const showBanner = !!adaptationProgress &&
    adaptationProgress.active !== 'idle' &&
    !bannerDismissed;

  return (
    <div className="insights-bar-mobile border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-3 lg:px-4 py-2 z-10" style={{ position: 'relative', overflow: 'visible' }}>
      <div style={{
        position: 'absolute',
        bottom: -1, left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
        opacity: 0.85,
        pointerEvents: 'none',
        zIndex: 10,
      }} />
      <div className="flex flex-col gap-2 lg:gap-3 w-full">

        {/* Single row: View dropdown | sep | TRANSLATE | ADAPTATION | Language | Metronome | … | INSIGHTS (right) */}
        <div className="flex items-center gap-2 min-w-0">

          {/* ── View dropdown (replaces LYRICS Editors buttons) ─────── */}
          <ViewModeSelector
            editMode={editMode}
            switchEditMode={switchEditMode}
            disabled={isGenerating || isAnalyzing}
          />

          <div className="hidden lg:block h-4 w-px bg-[var(--border-color)] shrink-0" />

          {/* ── TRANSLATE group (was Structure & Insights) ───────────── */}
          <h3 className="micro-label text-[var(--text-secondary)] hidden lg:flex items-center gap-2 shrink-0 whitespace-nowrap">
            <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
            {t.insights.title}
          </h3>
          <div className="hidden lg:block h-4 w-px bg-[var(--border-color)] shrink-0" />

          {showTranslationFeatures && (
            <>
              <Tooltip title={t.tooltips.adaptSong.replaceAll('{lang}', targetLanguageDisplayText)}>
                <button
                  onClick={() => adaptSongLanguage(targetLanguage)}
                  disabled={isAdaptingLanguage || song.length === 0}
                  aria-disabled={isAdaptingLanguage || song.length === 0}
                  aria-busy={isAdaptingLanguage}
                  className="ux-interactive px-3 py-1 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 text-[var(--accent-color)] text-[10px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {isAdaptingLanguage
                    ? (<>
                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                        <span className="sr-only">{t.editor.adaptingLabel ?? 'Adapting\u2026'}</span>
                      </>)
                    : <Languages className="w-3 h-3" aria-hidden="true" />}
                  <span className="hidden sm:inline">{t.editor.adaptation}</span>
                </button>
              </Tooltip>

              <div className="min-w-0 overflow-hidden" style={{ maxWidth: '180px' }}>
                <LcarsSelect
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                  options={LANGUAGE_SELECT_OPTIONS}
                />
              </div>
            </>
          )}

          {toggleMetronome && (
            <Tooltip title={t.musical?.metronome ?? 'Metronome'}>
              <button
                onClick={toggleMetronome}
                className={`px-2 py-1 text-[11px] rounded transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border ${
                  isMetronomeActive ? 'border-transparent metronome-active' : 'glass-button'
                }`}
                style={isMetronomeActive ? { background: '#f59e0b', color: '#000', borderColor: '#f59e0b' } : {}}
              >
                <Timer className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </Tooltip>
          )}

          {/* ── INSIGHTS group (was LYRICS Insights), right-aligned ──── */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <span className="hidden lg:inline micro-label text-zinc-500 whitespace-nowrap mr-0.5">{t.editor.lyricsInsights ?? 'INSIGHTS'}</span>
            <Tooltip title={detectedDisplays.length > 0
              ? (t.tooltips.redetectLanguage ?? 'Detected: {langs} \u2014 click to re-detect').replace('{langs}', detectedLanguageList)
              : (t.tooltips.detectLanguage ?? 'Detect song language')}>
              <button
                onClick={() => void detectLanguage()}
                disabled={isDetectingLanguage || song.length === 0}
                aria-disabled={isDetectingLanguage || song.length === 0}
                aria-busy={isDetectingLanguage}
                className="ux-interactive px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 border border-white/10 whitespace-nowrap shrink-0"
              >
                {isDetectingLanguage
                  ? (<>
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      <span className="sr-only">{t.editor.detectingLanguageLabel ?? 'Detecting language\u2026'}</span>
                    </>)
                  : <ScanText className="w-3 h-3" aria-hidden="true" />}
                {detectedDisplays.length > 0
                  ? <><EmojiSign sign={detectedDisplays[0]!.sign} /><span className="hidden sm:inline">{detectedDisplays[0]!.label}</span></>
                  : <><EmojiSign sign="🌐" /><span className="hidden sm:inline">{t.editor.detect ?? 'Detect'}</span></>}
              </button>
            </Tooltip>
            <Tooltip title={t.tooltips.analyzeTheme}>
              <button
                onClick={analyzeCurrentSong}
                disabled={isGenerating || isAnalyzing || song.length === 0}
                aria-disabled={isGenerating || isAnalyzing || song.length === 0}
                aria-busy={isAnalyzing}
                className="px-2 lg:px-3 py-1 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing
                  ? (<>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span className="sr-only">{t.editor.analyzingLabel ?? 'Analyzing\u2026'}</span>
                    </>)
                  : <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />}
                <span className="hidden lg:inline">{t.editor.analyze}</span>
              </button>
            </Tooltip>
            <Tooltip title={t.tooltips.checkSimilarity}>
              <button
                onClick={() => setIsSimilarityModalOpen(true)}
                disabled={isGenerating || isAnalyzing || !hasLyrics}
                aria-disabled={isGenerating || isAnalyzing || !hasLyrics}
                className="px-2 lg:px-3 py-1 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                {webSimilarityIndex.status === 'running'
                  ? (<>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)]" aria-hidden="true" />
                      <span className="sr-only">{t.editor.checkingSimilarityLabel ?? 'Checking similarity\u2026'}</span>
                    </>)
                  : <Search className="w-3.5 h-3.5" aria-hidden="true" />}
                <span className="hidden lg:inline">{t.ribbon?.similarity || 'Similarity'}</span>
                {webBadgeLabel && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded-sm text-[9px] text-[var(--accent-color)]" aria-hidden="true">{webBadgeLabel}</span>
                )}
                {!webBadgeLabel && libraryCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded-sm text-[9px]" aria-hidden="true">{libraryCount}</span>
                )}
              </button>
            </Tooltip>
          </div>

          {/* ── Mobile KPIs ───────────────────────────────────────── */}
          <div className="flex lg:hidden items-center gap-3 shrink-0">
            <div className="flex flex-col items-end">
              <span className="micro-label text-zinc-500">{t.insights.sections}</span>
              <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{sectionCount}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="micro-label text-zinc-500">{t.insights.words}</span>
              <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{wordCount}</span>
            </div>
            <div className="hidden sm:flex lg:hidden flex-col items-end">
              <span className="micro-label text-zinc-500">{t.insights.characters}</span>
              <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{charCount}</span>
            </div>
          </div>
        </div>

        {showBanner && adaptationProgress && (
          <AdaptationProgressBanner
            progress={adaptationProgress}
            result={adaptationResult ?? null}
            onDismiss={() => setBannerDismissed(true)}
            isOverlay
          />
        )}

      </div>
    </div>
  );
});

import React from 'react';
import { Loader2, BarChart2, Languages, ScanText, Layout, Search, Timer, CheckCircle2, AlertTriangle, XCircle } from '../ui/icons';
import { LcarsSelect } from '../ui/LcarsSelect';
import { Tooltip } from '../ui/Tooltip';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES, getLanguageDisplay } from '../../i18n';
import type { useSimilarityEngine } from '../../hooks/useSimilarityEngine';
import type { AdaptationProgress, AdaptationResult } from '../../hooks/analysis/useLanguageAdapter';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useAppKpis } from '../../hooks/useAppKpis';

interface InsightsBarProps {
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isAdaptingLanguage: boolean;
  isDetectingLanguage: boolean;
  isAnalyzing: boolean;
  isMarkupMode: boolean;
  webSimilarityIndex: ReturnType<typeof useSimilarityEngine>['index'];
  webBadgeLabel: string | null;
  libraryCount: number;
  adaptSongLanguage: (lang: string) => void;
  detectLanguage: () => void;
  analyzeCurrentSong: () => void;
  handleMarkupToggle: () => void;
  setIsSimilarityModalOpen: (open: boolean) => void;
  isMetronomeActive?: boolean;
  toggleMetronome?: () => void;
  adaptationProgress?: AdaptationProgress;
  adaptationResult?: AdaptationResult | null;
}

// ---------------------------------------------------------------------------
// AdaptationProgressBanner
// ---------------------------------------------------------------------------

const ORDERED_STEP_IDS = ['adapting', 'reversing', 'reviewing', 'done'] as const;

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-400/10 border-emerald-400/30';
  if (score >= 60) return 'bg-amber-400/10 border-amber-400/30';
  return 'bg-red-400/10 border-red-400/30';
}

function AdaptationProgressBanner({
  progress,
  result,
  onDismiss,
  isOverlay,
}: {
  progress: AdaptationProgress;
  result: AdaptationResult | null;
  onDismiss: () => void;
  isOverlay?: boolean;
}) {
  if (progress.active === 'idle') return null;

  const isFailed = progress.active === 'failed';
  const isDone   = progress.active === 'done';

  const banner = (
    <div
      className={`w-full rounded border px-3 py-2 ${isOverlay ? 'mt-0' : 'mt-1'} flex flex-col gap-1.5 text-[10px] ${
        isFailed
          ? 'bg-red-400/5 border-red-400/20'
          : isDone && result
          ? scoreBg(result.score)
          : 'bg-white/3 border-white/10'
      }`}
    >
      {/* Header: label + dismiss */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold tracking-wider uppercase text-zinc-300">
          {isFailed
            ? <XCircle className="w-3 h-3 text-red-400" />
            : isDone && result
            ? result.accepted
              ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              : <AlertTriangle className="w-3 h-3 text-amber-400" />
            : <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-color)]" />}
          <span className="text-zinc-400">{progress.label}</span>
        </div>
        {(isDone || isFailed) && (
          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors leading-none px-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {ORDERED_STEP_IDS.map((stepId, idx) => {
          const activeIdx  = ORDERED_STEP_IDS.indexOf(
            isFailed ? 'reviewing' : (progress.active as typeof ORDERED_STEP_IDS[number]) === 'done'
              ? 'done'
              : progress.active as typeof ORDERED_STEP_IDS[number]
          );
          const stepDone    = isDone || idx < activeIdx;
          const stepActive  = !isDone && !isFailed && idx === activeIdx;
          const stepPending = !stepDone && !stepActive;

          const stepLabel = ORDERED_STEP_IDS[idx] === 'adapting'  ? 'Adapting'
                          : ORDERED_STEP_IDS[idx] === 'reversing' ? 'Reverse'
                          : ORDERED_STEP_IDS[idx] === 'reviewing' ? 'Review'
                          : 'Done';

          return (
            <React.Fragment key={stepId}>
              <div className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    stepDone
                      ? 'bg-emerald-400'
                      : stepActive
                      ? 'bg-[var(--accent-color)] animate-pulse'
                      : 'bg-white/15'
                  }`}
                />
                <span
                  className={`whitespace-nowrap ${
                    stepDone
                      ? 'text-emerald-400'
                      : stepActive
                      ? 'text-[var(--accent-color)] font-semibold'
                      : 'text-zinc-600'
                  }`}
                >
                  {stepLabel}
                </span>
              </div>
              {idx < ORDERED_STEP_IDS.length - 1 && (
                <span className="text-zinc-700 mx-0.5">›</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Result: score + warnings */}
      {isDone && result && (
        <div className="flex flex-col gap-1 mt-0.5">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Fidelity score</span>
            <span className={`font-bold tabular-nums ${scoreColor(result.score)}`}>
              {result.score}/100
            </span>
            {!result.accepted && (
              <span className="text-amber-400 italic">— review recommended</span>
            )}
          </div>
          {result.warnings.length > 0 && (
            <ul className="flex flex-col gap-0.5 list-none pl-0 mt-0.5">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1 text-amber-300/80">
                  <span className="mt-0.5 shrink-0">·</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isFailed && (
        <span className="text-red-400">Adaptation pipeline failed. Check console for details.</span>
      )}
    </div>
  );

  if (isOverlay && !isDone && !isFailed) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden adaptation-particles" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md glass-panel border border-[var(--accent-color)]/20 rounded-2xl p-6 shadow-2xl adaptation-modal-glow">
          {banner}
        </div>
      </div>
    );
  }

  return banner;
}

// ---------------------------------------------------------------------------
// Static language options — built once at module level so EmojiSign instances
// are never remounted due to a new options array reference on each render.
// ---------------------------------------------------------------------------

const LANGUAGE_SELECT_OPTIONS = SUPPORTED_ADAPTATION_LANGUAGES.map(lang => ({
  value: lang.aiName,
  label: (
    <><EmojiSign sign={lang.sign} /> {lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}</>
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
  isMarkupMode,
  webSimilarityIndex,
  webBadgeLabel,
  libraryCount,
  adaptSongLanguage,
  detectLanguage,
  analyzeCurrentSong,
  handleMarkupToggle,
  setIsSimilarityModalOpen,
  isMetronomeActive,
  toggleMetronome,
  adaptationProgress,
  adaptationResult,
}: InsightsBarProps) {
  const { song, songLanguage } = useSongContext();
  const { isGenerating } = useComposerContext();
  const { sectionCount, wordCount, charCount } = useAppKpis();
  const { t } = useTranslation();
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  React.useEffect(() => {
    if (adaptationProgress && adaptationProgress.active !== 'idle') {
      setBannerDismissed(false);
    }
  }, [adaptationProgress?.active]);

  const targetDisplay = getLanguageDisplay(targetLanguage);
  const detectedDisplay = songLanguage ? getLanguageDisplay(songLanguage) : null;
  const targetLanguageDisplayText = targetDisplay ? `${targetDisplay.sign} ${targetDisplay.label}` : targetLanguage;

  const hasLyrics = song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0));

  const showBanner = !!adaptationProgress &&
    adaptationProgress.active !== 'idle' &&
    !bannerDismissed;

  return (
    <div className="insights-bar-mobile border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-3 lg:px-4 py-2 z-10" style={{ position: 'relative', overflow: 'visible' }}>
      {/* LCARS gradient separator */}
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

        {/* Single row: Language detect | Language dropdown (narrow) | ADAPTATION | Markup | Analyze | Similarity */}
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <h3 className="micro-label text-[var(--text-secondary)] hidden lg:flex items-center gap-2 shrink-0 whitespace-nowrap">
            <BarChart2 className="w-3.5 h-3.5" />
            {t.insights.title}
          </h3>
          <div className="hidden lg:block h-4 w-px bg-[var(--border-color)] shrink-0" />

          <Tooltip title={detectedDisplay ? `Detected: ${detectedDisplay.sign} ${detectedDisplay.label} — click to re-detect` : '🌐 Detect song language'}>
            <button
              onClick={() => void detectLanguage()}
              disabled={isDetectingLanguage || song.length === 0}
              className="ux-interactive px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 border border-white/10 whitespace-nowrap shrink-0"
            >
              {isDetectingLanguage
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <ScanText className="w-3 h-3" />}
              {detectedDisplay
                ? <><EmojiSign sign={detectedDisplay.sign} /><span className="hidden sm:inline">{detectedDisplay.label}</span></>
                : <><EmojiSign sign="🌐" /><span className="hidden sm:inline">Detect</span></>}
            </button>
          </Tooltip>

          <div className="min-w-0 overflow-hidden" style={{ maxWidth: '180px' }}>
            <LcarsSelect
              value={targetLanguage}
              onChange={setTargetLanguage}
              options={LANGUAGE_SELECT_OPTIONS}
            />
          </div>

          <Tooltip title={t.tooltips.adaptSong.replaceAll('{lang}', targetLanguageDisplayText)}>
            <button
              onClick={() => adaptSongLanguage(targetLanguage)}
              disabled={isAdaptingLanguage || song.length === 0}
              className="ux-interactive px-3 py-1 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 text-[var(--accent-color)] text-[10px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isAdaptingLanguage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
              <span className="hidden sm:inline">{t.editor.adaptation}</span>
            </button>
          </Tooltip>

          {toggleMetronome && (
            <Tooltip title={t.musical?.metronome ?? 'Metronome'}>
              <button
                onClick={toggleMetronome}
                className={`px-2 py-1.5 text-[11px] rounded transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border ${
                  isMetronomeActive ? 'border-transparent metronome-active' : 'glass-button'
                }`}
                style={isMetronomeActive ? { background: '#f59e0b', color: '#000', borderColor: '#f59e0b' } : {}}
              >
                <Timer className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
          <Tooltip title={isMarkupMode ? t.tooltips.editorMode : t.tooltips.markupMode}>
            <button
              onClick={handleMarkupToggle}
              disabled={isGenerating || isAnalyzing}
              className="px-2 lg:px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{isMarkupMode ? t.editor.editorMode : t.editor.markupModeLabel}</span>
            </button>
          </Tooltip>
          <Tooltip title={t.tooltips.analyzeTheme}>
            <button
              onClick={analyzeCurrentSong}
              disabled={isGenerating || isAnalyzing || song.length === 0}
              className="px-2 lg:px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.editor.analyze}</span>
            </button>
          </Tooltip>
          <Tooltip title={t.tooltips.checkSimilarity}>
            <button
              onClick={() => setIsSimilarityModalOpen(true)}
              disabled={isGenerating || isAnalyzing || !hasLyrics}
              className="px-2 lg:px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {webSimilarityIndex.status === 'running'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)]" />
                : <Search className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{t.ribbon?.similarity || 'Similarity'}</span>
              {webBadgeLabel && (
                <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded-sm text-[9px] text-[var(--accent-color)]">{webBadgeLabel}</span>
              )}
              {!webBadgeLabel && libraryCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded-sm text-[9px]">{libraryCount}</span>
              )}
            </button>
          </Tooltip>

          <div className="flex lg:hidden items-center gap-3 shrink-0 ml-auto">
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

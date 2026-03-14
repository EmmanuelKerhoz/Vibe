import React from 'react';
import { Loader2, BarChart2, Languages, ScanText, Layout, Search, RefreshCw, Timer } from 'lucide-react';
import { Section } from '../../types';
import { getSectionColorHex, getSectionDotColor } from '../../utils/songUtils';
import { LcarsSelect } from '../ui/LcarsSelect';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES, getLanguageDisplay } from '../../i18n';
import { emojiToTwemojiUrl } from '../../utils/emojiUtils';
import type { useSimilarityEngine } from '../../hooks/useSimilarityEngine';

interface InsightsBarProps {
  song: Section[];
  sectionCount: number;
  wordCount: number;
  charCount: number;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isAdaptingLanguage: boolean;
  isDetectingLanguage: boolean;
  songLanguage: string;
  isGenerating: boolean;
  isAnalyzing: boolean;
  isMarkupMode: boolean;
  webSimilarityIndex: ReturnType<typeof useSimilarityEngine>['index'];
  webBadgeLabel: string | null;
  libraryCount: number;
  adaptSongLanguage: (lang: string) => void;
  detectLanguage: () => void;
  analyzeCurrentSong: () => void;
  handleGlobalRegenerate: () => void;
  handleMarkupToggle: () => void;
  setIsSimilarityModalOpen: (open: boolean) => void;
  scrollToSection: (section: Section) => void;
  isMetronomeActive?: boolean;
  toggleMetronome?: () => void;
}

function EmojiSign({ sign }: { sign: string }) {
  const [useFallback, setUseFallback] = React.useState(false);

  if (useFallback) {
    return (
      <span
        aria-hidden="true"
        style={{
          fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
          lineHeight: 1,
          display: 'inline-block',
          fontSize: '1em',
        }}
      >
        {sign}
      </span>
    );
  }

  return (
    <img
      src={emojiToTwemojiUrl(sign)}
      alt={sign}
      aria-hidden="true"
      onError={() => setUseFallback(true)}
      style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: '-0.1em' }}
    />
  );
}

export function InsightsBar({
  song,
  sectionCount,
  wordCount,
  charCount,
  targetLanguage,
  setTargetLanguage,
  isAdaptingLanguage,
  isDetectingLanguage,
  songLanguage,
  isGenerating,
  isAnalyzing,
  isMarkupMode,
  webSimilarityIndex,
  webBadgeLabel,
  libraryCount,
  adaptSongLanguage,
  detectLanguage,
  analyzeCurrentSong,
  handleGlobalRegenerate,
  handleMarkupToggle,
  setIsSimilarityModalOpen,
  scrollToSection,
  isMetronomeActive,
  toggleMetronome,
}: InsightsBarProps) {
  const { t } = useTranslation();

  const targetDisplay = getLanguageDisplay(targetLanguage);
  const detectedDisplay = songLanguage ? getLanguageDisplay(songLanguage) : null;
  const targetLanguageDisplayText = targetDisplay ? `${targetDisplay.sign} ${targetDisplay.label}` : targetLanguage;

  return (
    <div className="insights-bar-mobile border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-3 lg:px-4 py-2 z-10">
      <div className="flex flex-col gap-2 lg:gap-3 w-full">

        {/* Row 1: Language tools + KPIs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language selector — shrinks on mobile */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="micro-label text-[var(--text-secondary)] hidden lg:flex items-center gap-2 shrink-0">
              <BarChart2 className="w-3.5 h-3.5" />
              {t.insights.title}
            </h3>
            <div className="hidden lg:block h-4 w-px bg-[var(--border-color)] shrink-0" />
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-1 min-w-0">
                <LcarsSelect
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                  options={SUPPORTED_ADAPTATION_LANGUAGES.map(lang => ({
                    value: lang.aiName,
                    label: <><EmojiSign sign={lang.sign} /> {lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}</>,
                  }))}
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
            </div>
          </div>

          {/* KPIs */}
          <div className="flex items-center gap-3 lg:gap-6 shrink-0">
            <div className="flex flex-col items-end">
              <span className="micro-label text-zinc-500">{t.insights.sections}</span>
              <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{sectionCount}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="micro-label text-zinc-500">{t.insights.words}</span>
              <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{wordCount}</span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="micro-label text-zinc-500">{t.insights.characters}</span>
              <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{charCount}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Section chips + action buttons */}
        <div className="flex items-center gap-2 w-full min-w-0">
          {/* Section chips — scroll independently */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar min-w-0 flex-1" style={{ scrollbarWidth: 'none' }}>
            {song.map((section) => {
              const sectionWordCount = section.lines
                .filter(l => !l.isMeta)
                .reduce((acc, line) => acc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0);
              return (
                <Tooltip key={section.id} title={
                  <div className="flex flex-col gap-1 text-xs">
                    <div><span>{t.editor.sectionTooltip.lines}:</span> {section.lines.filter(l => !l.isMeta).length}</div>
                    <div><span>{t.editor.sectionTooltip.words}:</span> {sectionWordCount}</div>
                  </div>
                }>
                  <button
                    onClick={() => scrollToSection(section)}
                    className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border border-transparent hover:border-white/20 transition-all lcars-section-chip glass-button"
                    style={{ color: getSectionColorHex(section.name) }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${getSectionDotColor(section.name)}`} />
                    {section.name}
                  </button>
                </Tooltip>
              );
            })}
          </div>

          {/* Action buttons — never scroll away */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
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
                disabled={isGenerating || isAnalyzing || song.length === 0}
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
            <Tooltip title={t.tooltips.regenerate}>
              <button
                onClick={handleGlobalRegenerate}
                disabled={isGenerating || isAnalyzing}
                className="px-2 lg:px-3 py-1.5 glass-button bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/40 hover:border-[var(--accent-color)] text-[11px] rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.2)] whitespace-nowrap text-[var(--accent-color)]"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span className="hidden lg:inline">{t.editor.regenerateGlobal}</span>
              </button>
            </Tooltip>
          </div>
        </div>

      </div>
    </div>
  );
}

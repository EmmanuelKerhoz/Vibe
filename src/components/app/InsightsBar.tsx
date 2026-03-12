import React from 'react';
import { Loader2, BarChart2, Languages, ScanText, Layout, Search, RefreshCw, Timer } from 'lucide-react';
import { Section } from '../../types';
import { getSectionColorHex, getSectionDotColor } from '../../utils/songUtils';
import { LcarsSelect } from '../ui/LcarsSelect';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES, adaptationLanguageLabel } from '../../i18n';
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
  /** Metronome controls — optional so existing callers keep working */
  isMetronomeActive?: boolean;
  toggleMetronome?: () => void;
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
  const supportedAdaptationLanguages = SUPPORTED_ADAPTATION_LANGUAGES;
  const adaptLangLabel = adaptationLanguageLabel;
  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-3 lg:px-4 py-2 z-10">
      <div className="lyrics-editor-zoom flex flex-col gap-2 lg:gap-4">
        {/* Row 1: Language tools + KPIs */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
            <h3 className="micro-label text-[var(--text-secondary)] hidden lg:flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5" />
              {t.insights.title}
            </h3>
            <div className="hidden lg:block h-4 w-px bg-[var(--border-color)]" />
            <div className="flex items-center gap-2">
              <LcarsSelect
                value={targetLanguage}
                onChange={setTargetLanguage}
                options={supportedAdaptationLanguages.map(lang => ({ value: lang.aiName, label: adaptLangLabel(lang) }))}
              />
              <Tooltip title={t.tooltips.adaptSong.replaceAll('{lang}', targetLanguage)}>
                <button onClick={() => adaptSongLanguage(targetLanguage)} disabled={isAdaptingLanguage || song.length === 0} className="px-3 py-1 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 text-[var(--accent-color)] text-[10px] font-bold rounded transition-all flex items-center gap-1.5 disabled:opacity-50">
                  {isAdaptingLanguage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                  <span className="hidden sm:inline">{t.editor.adaptation}</span>
                </button>
              </Tooltip>
              <Tooltip title={songLanguage ? `Detected: ${songLanguage} — click to re-detect` : 'Detect song language'}>
                <button onClick={() => void detectLanguage()} disabled={isDetectingLanguage || song.length === 0} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold rounded transition-all flex items-center gap-1.5 disabled:opacity-50 border border-white/10">
                  {isDetectingLanguage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanText className="w-3 h-3" />}
                  {songLanguage || 'Detect'}
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.sections}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{sectionCount}</span></div>
            <div className="flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.words}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{wordCount}</span></div>
            <div className="hidden sm:flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.characters}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{charCount}</span></div>
          </div>
        </div>
        {/* Row 2: Section chips + action buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar min-w-0 flex-1">
            {song.map((section) => {
              const sectionWordCount = section.lines.reduce((acc, line) => acc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0);
              return (
                <Tooltip key={section.id} title={
                  <div className="flex flex-col gap-1 text-xs">
                    <div><span>{t.editor.sectionTooltip.lines}:</span> {section.lines.length}</div>
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
          <div className="flex items-center gap-1.5 lg:gap-2 ml-2 flex-shrink-0">
            {/* Metronome button (B4) — shown when toggle is provided */}
            {toggleMetronome && (
              <Tooltip title={t.musical?.metronome ?? 'Metronome'}>
                <button
                  onClick={toggleMetronome}
                  className={`px-2 lg:px-2.5 py-1.5 text-[11px] rounded transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border ${
                    isMetronomeActive
                      ? 'border-transparent metronome-active'
                      : 'glass-button'
                  }`}
                  style={isMetronomeActive ? { background: '#f59e0b', color: '#000', borderColor: '#f59e0b' } : {}}
                  title={isMetronomeActive ? (t.musical?.metronomeStop ?? 'Stop Metronome') : (t.musical?.metronomeStart ?? 'Start Metronome')}
                >
                  <Timer className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
            <Tooltip title={isMarkupMode ? t.tooltips.editorMode : t.tooltips.markupMode}>
              <button onClick={handleMarkupToggle} disabled={isGenerating || isAnalyzing} className="px-2 lg:px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <Layout className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{isMarkupMode ? t.editor.editorMode : t.editor.markupModeLabel}</span>
              </button>
            </Tooltip>
            <Tooltip title={t.tooltips.analyzeTheme}>
              <button onClick={analyzeCurrentSong} disabled={isGenerating || isAnalyzing || song.length === 0} className="px-2 lg:px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
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
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded-sm text-[9px] text-[var(--accent-color)]">
                    {webBadgeLabel}
                  </span>
                )}
                {!webBadgeLabel && libraryCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded-sm text-[9px]">{libraryCount}</span>
                )}
              </button>
            </Tooltip>
            <Tooltip title={t.tooltips.regenerate}>
              <button onClick={handleGlobalRegenerate} disabled={isGenerating || isAnalyzing} className="px-2 lg:px-3 py-1.5 glass-button bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/40 hover:border-[var(--accent-color)] text-[11px] rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.2)] whitespace-nowrap text-[var(--accent-color)]">
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

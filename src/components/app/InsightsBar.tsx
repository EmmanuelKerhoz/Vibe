import React from 'react';
import { Loader2, BarChart2, Languages, ScanText, Save, Layout, Search, RefreshCw } from 'lucide-react';
import { Section } from '../../types';
import { getSectionColorHex, getSectionDotColor } from '../../utils/songUtils';
import { Select } from '../ui/Select';
import { MenuItem } from '../ui/MenuItem';
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
  handleOpenSaveToLibraryModal: () => void;
  handleMarkupToggle: () => void;
  setIsSimilarityModalOpen: (open: boolean) => void;
  scrollToSection: (section: Section) => void;
  t: ReturnType<typeof useTranslation>['t'];
  SUPPORTED_ADAPTATION_LANGUAGES: typeof SUPPORTED_ADAPTATION_LANGUAGES;
  adaptationLanguageLabel: typeof adaptationLanguageLabel;
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
  handleOpenSaveToLibraryModal,
  handleMarkupToggle,
  setIsSimilarityModalOpen,
  scrollToSection,
  t,
  SUPPORTED_ADAPTATION_LANGUAGES: supportedAdaptationLanguages,
  adaptationLanguageLabel: adaptLangLabel,
}: InsightsBarProps) {
  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-4 py-2 z-10">
      <div className="lyrics-editor-zoom flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="micro-label text-[var(--text-secondary)] flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5" />
              {t.insights.title}
            </h3>
            <div className="h-4 w-px bg-[var(--border-color)]" />
            <div className="flex items-center gap-2">
              <Select value={targetLanguage} onChange={(e: { target: { value?: string } }) => setTargetLanguage(e.target.value ?? '')} size="small" style={{ height: 24, fontSize: '10px', color: 'var(--colorNeutralForeground2)', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px' }}>
                {supportedAdaptationLanguages.map(lang => (
                  <MenuItem key={lang.code} value={lang.aiName} style={{ fontSize: '10px' }}>
                    {adaptLangLabel(lang)}
                  </MenuItem>
                ))}
              </Select>
              <Tooltip title={t.tooltips.adaptSong.replaceAll('{lang}', targetLanguage)}>
                <button onClick={() => adaptSongLanguage(targetLanguage)} disabled={isAdaptingLanguage || song.length === 0} className="px-3 py-1 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 text-[var(--accent-color)] text-[10px] font-bold rounded transition-all flex items-center gap-1.5 disabled:opacity-50">
                  {isAdaptingLanguage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                  {t.editor.adaptation}
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
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.sections}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{sectionCount}</span></div>
            <div className="flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.words}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{wordCount}</span></div>
            <div className="flex flex-col items-end"><span className="micro-label text-zinc-500">{t.insights.characters}</span><span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{charCount}</span></div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
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
          <div className="flex items-center gap-2 ml-4">
            <Tooltip title={t.saveToLibrary.saveDescription}>
              <button onClick={handleOpenSaveToLibraryModal} disabled={song.length === 0} className="px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="w-3.5 h-3.5" />
                {t.saveToLibrary.title}
              </button>
            </Tooltip>
            <Tooltip title={isMarkupMode ? t.tooltips.editorMode : t.tooltips.markupMode}>
              <button onClick={handleMarkupToggle} disabled={isGenerating || isAnalyzing} className="px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <Layout className="w-3.5 h-3.5" />
                {isMarkupMode ? t.editor.editorMode : t.editor.markupModeLabel}
              </button>
            </Tooltip>
            <Tooltip title={t.tooltips.analyzeTheme}>
              <button onClick={analyzeCurrentSong} disabled={isGenerating || isAnalyzing || song.length === 0} className="px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <BarChart2 className="w-3.5 h-3.5" />
                {t.editor.analyze}
              </button>
            </Tooltip>
            <Tooltip title={t.tooltips.checkSimilarity}>
              <button
                onClick={() => setIsSimilarityModalOpen(true)}
                disabled={isGenerating || isAnalyzing || song.length === 0}
                className="px-3 py-1.5 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                {webSimilarityIndex.status === 'running'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)]" />
                  : <Search className="w-3.5 h-3.5" />}
                {t.ribbon?.similarity || 'Similarity'}
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
              <button onClick={handleGlobalRegenerate} disabled={isGenerating || isAnalyzing} className="px-3 py-1.5 glass-button bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/40 hover:border-[var(--accent-color)] text-[11px] rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.2)] whitespace-nowrap text-[var(--accent-color)]">
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {t.editor.regenerateGlobal}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

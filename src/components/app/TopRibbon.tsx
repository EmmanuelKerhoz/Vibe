import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Download, Upload, Undo2, Redo2, Trash2, History, PanelLeft, PanelRight, MoreHorizontal, Library
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { IconButton } from '../ui/IconButton';
import { motion } from 'motion/react';
import { useTranslation } from '../../i18n';
import type { Section } from '../../types';

interface Props {
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (v: boolean) => void;
  activeTab: 'lyrics' | 'musical';
  setActiveTab: (v: 'lyrics' | 'musical') => void;
  song: Section[];
  past: unknown[];
  future: unknown[];
  undo: () => void;
  redo: () => void;
  setIsVersionsModalOpen: (v: boolean) => void;
  setIsResetModalOpen: (v: boolean) => void;
  isStructureOpen: boolean;
  setIsStructureOpen: (v: boolean) => void;
  hasApiKey: boolean;
  handleApiKeyHelp: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onOpenLibraryClick: () => void;
  isGenerating: boolean;
  isAnalyzing: boolean;
}

export function TopRibbon({
  isLeftPanelOpen, setIsLeftPanelOpen,
  activeTab, setActiveTab,
  song, past, future, undo, redo,
  setIsVersionsModalOpen, setIsResetModalOpen,
  isStructureOpen, setIsStructureOpen,
  hasApiKey, handleApiKeyHelp,
  onImportClick, onExportClick,
  onOpenLibraryClick,
  isGenerating, isAnalyzing,
}: Props) {
  const { t } = useTranslation();
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const isBusy = isGenerating || isAnalyzing;
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOverflowOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOverflowOpen]);

  return (
    <div className="h-16 border-b border-fluent-border flex items-center justify-between px-4 lg:px-8 z-10 glass-panel lcars-ribbon lcars-ribbon-rail rounded-none border-t-0 border-l-0 border-r-0 fluent-animate-panel">
      {/* Left: sidebar toggle + tab switcher */}
      <div className="flex items-center gap-3 lg:gap-6 pl-1 lg:pl-3">
        <Tooltip title={isLeftPanelOpen ? t.tooltips.collapseLeft : t.tooltips.showSidebar}>
          <button
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-zinc-500 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md transition-all duration-200"
            aria-label={isLeftPanelOpen ? t.tooltips.collapseLeft : t.tooltips.showSidebar}
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        </Tooltip>
        <div className="w-px h-6 bg-fluent-border" />
        <Tooltip title={t.tooltips.lyricsTab}>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`text-[10px] uppercase tracking-widest transition-all duration-200 relative py-5 font-semibold ${activeTab === 'lyrics' ? 'text-[var(--accent-color)]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-400'}`}
          >
            {t.ribbon.lyrics}
            {activeTab === 'lyrics' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />
            )}
          </button>
        </Tooltip>
        <Tooltip title={t.tooltips.musicalTab}>
          <button
            onClick={() => setActiveTab('musical')}
            className={`text-[10px] uppercase tracking-widest transition-all duration-200 relative py-5 font-semibold ${activeTab === 'musical' ? 'text-[#f59e0b]' : 'text-zinc-500 hover:text-[#f59e0b]'}`}
          >
            {t.ribbon.musical}
            {activeTab === 'musical' && (
              <motion.div layoutId="activeMusicalTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f59e0b]" />
            )}
          </button>
        </Tooltip>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2">
        {/* Desktop-only: full action row */}
        <div className="hidden lg:flex items-center gap-2">
          <Tooltip title={t.tooltips.import}>
            <Button onClick={onImportClick} variant="outlined" color="info" size="small" startIcon={<Upload className="w-3.5 h-3.5" />} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
              {t.ribbon.import}
            </Button>
          </Tooltip>
          <Tooltip title={t.tooltips.export}>
            <Button onClick={onExportClick} disabled={song.length === 0} variant="outlined" color="info" size="small" startIcon={<Download className="w-3.5 h-3.5" />} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
              {t.ribbon.export}
            </Button>
          </Tooltip>
          <Tooltip title={t.saveToLibrary.browseDescription}>
            <Button onClick={onOpenLibraryClick} variant="outlined" color="info" size="small" startIcon={<Library className="w-3.5 h-3.5" />} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
              {t.saveToLibrary.title}
            </Button>
          </Tooltip>
          <div className="w-px h-4 bg-[var(--border-color)] mx-2" />
          <Tooltip title={t.tooltips.versions}>
            <IconButton onClick={() => setIsVersionsModalOpen(true)} size="small" style={{ color: 'var(--text-secondary)' }}>
              <History className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.tooltips.undo}>
            <IconButton
              onClick={undo}
              disabled={!canUndo}
              size="small"
              style={{ color: canUndo ? 'var(--accent-color)' : 'var(--text-secondary)' }}
              className={canUndo ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20' : 'opacity-40 saturate-0 cursor-not-allowed'}
              aria-disabled={!canUndo}
            >
              <Undo2 className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.tooltips.redo}>
            <IconButton
              onClick={redo}
              disabled={!canRedo}
              size="small"
              style={{ color: canRedo ? 'var(--accent-color)' : 'var(--text-secondary)' }}
              className={canRedo ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20' : 'opacity-40 saturate-0 cursor-not-allowed'}
              aria-disabled={!canRedo}
            >
              <Redo2 className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <div className="w-px h-4 bg-[var(--border-color)] mx-2" />
          <Tooltip title={t.tooltips.reset}>
            <IconButton onClick={() => setIsResetModalOpen(true)} disabled={song.length === 0} size="small" style={{ color: 'var(--accent-critical)' }}>
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <div className="w-px h-4 bg-[var(--border-color)] mx-2" />
          {!hasApiKey && (
            <Tooltip title={t.tooltips.aiUnavailableHelp}>
              <button onClick={handleApiKeyHelp} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-lg flex items-center gap-2 hover:bg-amber-500/20 transition-all">
                <Sparkles className="w-3 h-3" />
                {t.ribbon.aiUnavailable}
              </button>
            </Tooltip>
          )}
        </div>

        {/* Mobile-only: compact undo/redo + busy indicator + overflow menu */}
        <div className="flex lg:hidden items-center gap-1">
          {isBusy && (
            <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" aria-hidden="true" />
          )}
          {!hasApiKey && (
            <button onClick={handleApiKeyHelp} className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-all">
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          <IconButton
            onClick={undo}
            disabled={!canUndo}
            size="small"
            style={{ color: canUndo ? 'var(--accent-color)' : 'var(--text-secondary)', minWidth: 44, minHeight: 44 }}
            className={canUndo ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20' : 'opacity-40 saturate-0 cursor-not-allowed'}
            aria-disabled={!canUndo}
            aria-label={t.tooltips.undo}
          >
            <Undo2 className="w-4 h-4" />
          </IconButton>
          <IconButton
            onClick={redo}
            disabled={!canRedo}
            size="small"
            style={{ color: canRedo ? 'var(--accent-color)' : 'var(--text-secondary)', minWidth: 44, minHeight: 44 }}
            className={canRedo ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20' : 'opacity-40 saturate-0 cursor-not-allowed'}
            aria-disabled={!canRedo}
            aria-label={t.tooltips.redo}
          >
            <Redo2 className="w-4 h-4" />
          </IconButton>

          {/* Overflow "..." menu */}
          <div className="relative" ref={overflowRef}>
            <button
              onClick={() => setIsOverflowOpen(v => !v)}
              aria-label="More actions"
              aria-expanded={isOverflowOpen}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md transition-all"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {isOverflowOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 glass-panel border border-[var(--border-color)] rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                <button
                  onClick={() => { onImportClick(); setIsOverflowOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[11px] text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors"
                >
                  <Upload className="w-4 h-4 text-[var(--text-secondary)]" />
                  {t.ribbon.import}
                </button>
                <button
                  onClick={() => { onExportClick(); setIsOverflowOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[11px] text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                  {t.ribbon.export}
                </button>
                <button
                  onClick={() => { onOpenLibraryClick(); setIsOverflowOpen(false); }}
                  disabled={song.length === 0}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[11px] text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors disabled:opacity-50"
                >
                  <Library className="w-4 h-4 text-[var(--text-secondary)]" />
                  {t.saveToLibrary.title}
                </button>
                <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
                <button
                  onClick={() => { setIsVersionsModalOpen(true); setIsOverflowOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[11px] text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors"
                >
                  <History className="w-4 h-4 text-[var(--text-secondary)]" />
                  {t.ribbon.versions}
                </button>
                <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
                <button
                  onClick={() => { setIsResetModalOpen(true); setIsOverflowOpen(false); }}
                  disabled={song.length === 0}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.ribbon.reset}
                </button>
              </div>
            )}
          </div>
        </div>

        <Tooltip title={isStructureOpen ? t.tooltips.collapseRight : t.tooltips.showSidebar}>
          <button
            onClick={() => setIsStructureOpen(!isStructureOpen)}
            aria-label={isStructureOpen ? t.tooltips.collapseRight : t.tooltips.showSidebar}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md transition-colors"
          >
            <PanelRight className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

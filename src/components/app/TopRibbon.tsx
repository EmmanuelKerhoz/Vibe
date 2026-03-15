import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Download, Upload, Undo2, Redo2, Trash2, History,
  PanelRight, Library, Menu, FilePlus, Settings, Info, WandSparkles, ClipboardPaste
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { IconButton } from '../ui/IconButton';
import { motion } from 'motion/react';
import { useTranslation } from '../../i18n';
import type { Section } from '../../types';

interface Props {
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
  onOpenNewGeneration: () => void;
  onOpenNewEmpty: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onOpenLibraryClick: () => void;
  onOpenSettingsClick: () => void;
  onOpenAboutClick: () => void;
  onPasteLyrics: () => void;
  isGenerating: boolean;
  isAnalyzing: boolean;
}

export function TopRibbon({
  activeTab, setActiveTab,
  song, past, future, undo, redo,
  setIsVersionsModalOpen, setIsResetModalOpen,
  isStructureOpen, setIsStructureOpen,
  hasApiKey, handleApiKeyHelp,
  onOpenNewGeneration, onOpenNewEmpty,
  onImportClick, onExportClick,
  onOpenLibraryClick,
  onOpenSettingsClick, onOpenAboutClick,
  onPasteLyrics,
  isGenerating, isAnalyzing,
}: Props) {
  const { t } = useTranslation();
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const isBusy = isGenerating || isAnalyzing;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMenuOpen]);

  const runMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <div
      className="h-16 border-b border-fluent-border flex items-center justify-between px-4 lg:px-8 lcars-ribbon lcars-ribbon-rail rounded-none border-t-0 border-l-0 border-r-0"
      style={{
        position: 'relative',
        overflow: 'visible',
        backgroundColor: 'var(--bg-app, #0c0c0c)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        zIndex: 20,
      }}
    >
      {/* LCARS gradient separator */}
      <div style={{
        position: 'absolute',
        bottom: -1, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
        opacity: 0.85, pointerEvents: 'none', zIndex: 1,
      }} />

      {/* LEFT: burger flush to left edge + tabs */}
      <div className="flex items-center gap-3 lg:gap-6 pl-0">
        <div className="relative" style={{ zIndex: 60 }} ref={menuRef}>
          <Tooltip title="Menu">
            <button
              onClick={() => setIsMenuOpen(v => !v)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-all duration-200"
              style={{
                color: isMenuOpen ? 'var(--accent-color)' : 'var(--text-secondary)',
                backgroundColor: isMenuOpen ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)' : undefined,
              }}
              aria-label="Open main menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </Tooltip>

          {isMenuOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-[280px] rounded-2xl shadow-2xl py-1.5 overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-app, #111)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.10))',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)',
                zIndex: 50,
              }}
            >
              {/* Create */}
              <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Create</div>
              <button onClick={() => runMenuAction(onImportClick)} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <Upload className="w-4 h-4 text-[var(--accent-color)]" />
                Load/Import
              </button>
              <button onClick={() => runMenuAction(onPasteLyrics)} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <ClipboardPaste className="w-4 h-4 text-[var(--text-secondary)]" />
                Coller des paroles
              </button>
              <button onClick={() => runMenuAction(onOpenNewGeneration)} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <WandSparkles className="w-4 h-4 text-[var(--text-secondary)]" />
                New generation
              </button>
              <button onClick={() => runMenuAction(onOpenNewEmpty)} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <FilePlus className="w-4 h-4 text-[var(--text-secondary)]" />
                New empty
              </button>

              {/* Workspace */}
              <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
              <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Workspace</div>
              <button onClick={() => runMenuAction(onOpenLibraryClick)} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <Library className="w-4 h-4 text-[var(--text-secondary)]" />
                {t.saveToLibrary.title}
              </button>
              <button onClick={() => runMenuAction(() => setActiveTab('musical'))} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                {t.ribbon.musical}
              </button>

              {/* Tools */}
              <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
              <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Tools</div>
              <button onClick={() => runMenuAction(onExportClick)} disabled={song.length === 0} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors disabled:opacity-50">
                <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                Save/Export
              </button>
              <button onClick={() => runMenuAction(() => setIsVersionsModalOpen(true))} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <History className="w-4 h-4 text-[var(--text-secondary)]" />
                {t.ribbon.versions}
              </button>
              <button onClick={() => runMenuAction(() => setIsResetModalOpen(true))} disabled={song.length === 0} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {t.ribbon.reset}
              </button>

              {/* App */}
              <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
              <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">App</div>
              <button onClick={() => runMenuAction(onOpenSettingsClick)} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                Settings
              </button>
              <button onClick={() => runMenuAction(onOpenAboutClick)} className="w-full flex items-center gap-3 px-4 py-2 text-[12px] text-left text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 transition-colors">
                <Info className="w-4 h-4 text-[var(--text-secondary)]" />
                About
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-fluent-border opacity-40" />

        <Tooltip title={t.tooltips.lyricsTab}>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`text-[10px] uppercase tracking-widest transition-all duration-200 relative py-5 font-semibold ${
              activeTab === 'lyrics' ? 'text-[var(--accent-color)]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-400'
            }`}
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
            className={`text-[10px] uppercase tracking-widest transition-all duration-200 relative py-5 font-semibold ${
              activeTab === 'musical' ? 'text-[#f59e0b]' : 'text-zinc-500 hover:text-[#f59e0b]'
            }`}
          >
            {t.ribbon.musical}
            {activeTab === 'musical' && (
              <motion.div layoutId="activeMusicalTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f59e0b]" />
            )}
          </button>
        </Tooltip>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1 lg:gap-2">
        {isBusy && (
          <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" aria-label="Processing" title="Processing…" />
        )}
        {!hasApiKey && (
          <Tooltip title={t.tooltips.aiUnavailableHelp}>
            <button
              onClick={handleApiKeyHelp}
              className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-lg hover:bg-amber-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.ribbon.aiUnavailable}</span>
            </button>
          </Tooltip>
        )}
        <div className="w-px h-4 bg-[var(--border-color)] mx-1 hidden lg:block" />
        <Tooltip title={t.tooltips.undo}>
          <IconButton onClick={undo} disabled={!canUndo} size="small"
            style={{ color: canUndo ? 'var(--accent-color)' : 'var(--text-secondary)', minWidth: 36, minHeight: 36 }}
            className={canUndo ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20' : 'opacity-40 saturate-0 cursor-not-allowed'}
            aria-disabled={!canUndo} aria-label={t.tooltips.undo}>
            <Undo2 className="w-4 h-4" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t.tooltips.redo}>
          <IconButton onClick={redo} disabled={!canRedo} size="small"
            style={{ color: canRedo ? 'var(--accent-color)' : 'var(--text-secondary)', minWidth: 36, minHeight: 36 }}
            className={canRedo ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20' : 'opacity-40 saturate-0 cursor-not-allowed'}
            aria-disabled={!canRedo} aria-label={t.tooltips.redo}>
            <Redo2 className="w-4 h-4" />
          </IconButton>
        </Tooltip>
        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
        <Tooltip title={isStructureOpen ? t.tooltips.collapseRight : t.tooltips.showSidebar}>
          <button
            onClick={() => setIsStructureOpen(!isStructureOpen)}
            aria-label={isStructureOpen ? t.tooltips.collapseRight : t.tooltips.showSidebar}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors"
            style={{
              color: isStructureOpen ? 'var(--accent-color)' : 'var(--text-secondary)',
              backgroundColor: isStructureOpen ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : undefined,
            }}
          >
            <PanelRight className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

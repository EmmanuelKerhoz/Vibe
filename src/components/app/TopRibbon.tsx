import React from 'react';
import {
  Sparkles, Download, Upload, Undo2, Redo2, Trash2, History, PanelLeft, PanelRight
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
  exportTxt: () => void;
  exportMd: () => void;
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
  onImportClick, exportTxt, exportMd,
  isGenerating, isAnalyzing,
}: Props) {
  const { t } = useTranslation();
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return (
    <div className="h-16 border-b border-fluent-border flex items-center justify-between px-8 z-10 glass-panel lcars-ribbon lcars-ribbon-rail rounded-none border-t-0 border-l-0 border-r-0">
      <div className="flex items-center gap-6 pl-3">
        <Tooltip title={isLeftPanelOpen ? t.tooltips.hideSidebar : t.tooltips.showSidebar}>
          <button
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className="p-2 -ml-4 text-zinc-500 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md transition-all duration-200"
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
            className={`text-[10px] uppercase tracking-widest transition-all duration-200 relative py-5 font-semibold ${activeTab === 'musical' ? 'text-[var(--accent-color)]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-400'}`}
          >
            {t.ribbon.musical}
            {activeTab === 'musical' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />
            )}
          </button>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip title={t.tooltips.import}>
          <Button onClick={onImportClick} variant="outlined" color="info" size="small" startIcon={<Upload className="w-3.5 h-3.5" />} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
            {t.ribbon.import}
          </Button>
        </Tooltip>
        <Tooltip title={t.tooltips.exportTxt}>
          <Button onClick={exportTxt} disabled={song.length === 0} variant="outlined" color="info" size="small" startIcon={<Download className="w-3.5 h-3.5" />} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
            {t.ribbon.exportTxt}
          </Button>
        </Tooltip>
        <Tooltip title={t.tooltips.exportMd}>
          <Button onClick={exportMd} disabled={song.length === 0} variant="outlined" color="info" size="small" startIcon={<Download className="w-3.5 h-3.5" />} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
            {t.ribbon.exportMd}
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
        <Tooltip title={isStructureOpen ? t.tooltips.hideSidebar : t.tooltips.showSidebar}>
          <button onClick={() => setIsStructureOpen(!isStructureOpen)} className="p-2 text-zinc-500 hover:text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md transition-colors">
            <PanelRight className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

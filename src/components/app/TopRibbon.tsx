import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Download, Upload, Undo2, Redo2, Trash2, History,
  PanelRight, Library, Menu, FilePlus, Settings, Info, KeyboardRegular, WandSparkles, ClipboardPaste, Heart
} from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { IconButton } from '../ui/IconButton';
import { motion } from 'motion/react';
import { useTranslation } from '../../i18n';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useAppNavigationContext } from '../../contexts/AppStateContext';
import { useTopRibbonActions } from '../../hooks/useTopRibbonActions';

/**
 * TopRibbon — application toolbar.
 *
 * Props surface only what cannot be sourced from an existing context:
 *   hasApiKey          — from useSessionState (no dedicated context yet)
 *   handleApiKeyHelp   — callback from useAppHandlers (parent-scoped)
 *   onOpenNewGeneration — wizard callback (parent-scoped state machine)
 *   onOpenNewEmpty      — session action (parent-scoped)
 *
 * All modal-open actions and analysis state are sourced via
 * useTopRibbonActions() (ModalContext + AnalysisContext).
 */
interface Props {
  hasApiKey: boolean;
  handleApiKeyHelp: () => void;
  onOpenNewGeneration: () => void;
  onOpenNewEmpty: () => void;
}

export function TopRibbon({
  hasApiKey,
  handleApiKeyHelp,
  onOpenNewGeneration,
  onOpenNewEmpty,
}: Props) {
  const MENU_WIDTH = 280;
  const MENU_VIEWPORT_PADDING = 12;
  const MENU_VERTICAL_OFFSET = 6;
  const MENU_BOTTOM_PADDING = 16;

  const { song, past, future, undo, redo } = useSongContext();
  const { isGenerating, clearSelection } = useComposerContext();
  const {
    activeTab,
    setActiveTab,
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    isStructureOpen,
    setIsStructureOpen,
  } = useAppNavigationContext();
  const {
    openVersionsModal, openResetModal, openImport, openExport,
    openLibrary, openSettings, openAbout, openKeyboardShortcuts,
    openPasteModal, canPasteLyrics, isAnalyzing,
  } = useTopRibbonActions();
  const { t } = useTranslation();

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const isBusy = isGenerating || isAnalyzing;
  const processingLabel = t.tooltips.processing ?? 'Processing\u2026';
  const panelToggleLabel = isLeftPanelOpen
    ? (t.tooltips.closeLeftPanel ?? 'Close lyrics generation panel')
    : (t.tooltips.openLeftPanel ?? 'Open lyrics generation panel');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    left: MENU_VIEWPORT_PADDING,
    top: MENU_VERTICAL_OFFSET,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuActionClass = 'flex w-full items-center gap-3 bg-transparent px-4 py-2.5 text-[12px] text-left transition-colors outline-none focus-visible:bg-[var(--accent-color)]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent';

  useEffect(() => {
    if (!isMenuOpen) return;
    const updateMenuPosition = () => {
      const rect = menuButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({
        left: Math.max(MENU_VIEWPORT_PADDING, Math.min(rect.left, window.innerWidth - MENU_VIEWPORT_PADDING - MENU_WIDTH)),
        top: rect.bottom + MENU_VERTICAL_OFFSET,
      });
    };
    updateMenuPosition();
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [isMenuOpen]);

  const runMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const toggleLeftPanel = () => {
    if (!isLeftPanelOpen) {
      setActiveTab('lyrics');
      setIsStructureOpen(false);
    }
    setIsLeftPanelOpen(!isLeftPanelOpen);
  };

  const toggleStructurePanel = () => {
    const next = !isStructureOpen;
    if (next) clearSelection();
    setIsStructureOpen(next);
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

      {/* LEFT: burger + tabs */}
      <div className="flex items-center gap-3 lg:gap-6 pl-0">
        <div className="relative" style={{ zIndex: 60 }} ref={menuRef}>
          <Tooltip title="Menu">
            <button
              ref={menuButtonRef}
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
              className="lcars-gradient-outline rounded-[18px_6px_18px_6px] shadow-2xl py-1.5 overflow-x-hidden overflow-y-auto"
              style={{
                position: 'fixed',
                left: `${menuPosition.left}px`,
                top: `${menuPosition.top}px`,
                width: `${MENU_WIDTH}px`,
                maxHeight: `calc(100dvh - ${menuPosition.top}px - var(--mobile-nav-h, 56px) - var(--sab, 0px) - ${MENU_BOTTOM_PADDING}px)`,
                backgroundColor: 'var(--bg-app, #111)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)',
                zIndex: 70,
              }}
            >
              {/* Create */}
              <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Create</div>
              <Tooltip title="Generate new lyrics using AI">
                <button onClick={() => runMenuAction(onOpenNewGeneration)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <WandSparkles className="w-4 h-4 text-[var(--text-secondary)]" />
                  New Lyrics Generation
                </button>
              </Tooltip>
              <Tooltip title="Create a new empty song">
                <button onClick={() => runMenuAction(onOpenNewEmpty)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <FilePlus className="w-4 h-4 text-[var(--text-secondary)]" />
                  New Song
                </button>
              </Tooltip>
              <Tooltip title="Import lyrics from a file">
                <button onClick={() => runMenuAction(openImport)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <Upload className="w-4 h-4 text-[var(--accent-color)]" />
                  Load/Import
                </button>
              </Tooltip>
              <Tooltip title="Export your song to a file">
                <button onClick={() => runMenuAction(openExport)} disabled={song.length === 0} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10 disabled:opacity-50`}>
                  <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                  Save/Export
                </button>
              </Tooltip>
              <Tooltip title="Paste lyrics from clipboard">
                <button disabled={!canPasteLyrics} onClick={() => runMenuAction(openPasteModal)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <ClipboardPaste className="w-4 h-4 text-[var(--text-secondary)]" />
                  {t.editor.emptyState.pasteLyrics}
                </button>
              </Tooltip>

              {/* Workspace */}
              <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
              <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Workspace</div>
              <Tooltip title="Save or browse your song library">
                <button onClick={() => runMenuAction(openLibrary)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <Library className="w-4 h-4 text-[var(--text-secondary)]" />
                  {t.saveToLibrary.title}
                </button>
              </Tooltip>
              <Tooltip title="Switch to the musical tab">
                <button onClick={() => runMenuAction(() => setActiveTab('musical'))} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                  {t.ribbon.musical}
                </button>
              </Tooltip>

              {/* Tools */}
              <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
              <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">Tools</div>
              <Tooltip title="Browse and restore previous lyrics versions">
                <button onClick={() => runMenuAction(openVersionsModal)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <History className="w-4 h-4 text-[var(--text-secondary)]" />
                  {t.ribbon.versions}
                </button>
              </Tooltip>
              <Tooltip title="Open application settings">
                <button onClick={() => runMenuAction(openSettings)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                  Settings
                </button>
              </Tooltip>
              <Tooltip title="Reset and clear the current song">
                <button onClick={() => runMenuAction(openResetModal)} disabled={song.length === 0} className={`${menuActionClass} text-red-400 hover:bg-red-500/10 disabled:opacity-50`}>
                  <Trash2 className="w-4 h-4" />
                  {t.ribbon.reset}
                </button>
              </Tooltip>

              {/* App */}
              <div className="h-px bg-[var(--border-color)] mx-3 my-1" />
              <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">App</div>
              <Tooltip title="About this application">
                <button onClick={() => runMenuAction(openAbout)} className={`${menuActionClass} text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10`}>
                  <Info className="w-4 h-4 text-[var(--text-secondary)]" />
                  About
                </button>
              </Tooltip>
              <Tooltip title="Support the developer">
                <button
                  onClick={() => runMenuAction(() => window.open('https://github.com/sponsors/EmmanuelKerhoz', '_blank', 'noopener,noreferrer'))}
                  className={`${menuActionClass} text-pink-400 hover:bg-pink-500/10`}
                >
                  <Heart className="w-4 h-4" />
                  Sponsor
                </button>
              </Tooltip>
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
              <motion.div layoutId="activeTab" className="absolute bottom-[6px] left-0 right-0 h-0.5 bg-[var(--accent-color)]" />
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
              <motion.div layoutId="activeMusicalTab" className="absolute bottom-[6px] left-0 right-0 h-0.5 bg-[#f59e0b]" />
            )}
          </button>
        </Tooltip>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1 lg:gap-2">
        {isBusy && (
          <Tooltip title={processingLabel}>
            <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" aria-label={processingLabel.replace(/\u2026|\.{3}$/, '')} />
          </Tooltip>
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
        <Tooltip title={t.tooltips.keyboardShortcuts}>
          <button
            onClick={openKeyboardShortcuts}
            aria-label={t.tooltips.keyboardShortcuts}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <KeyboardRegular className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title={panelToggleLabel}>
          <button
            onClick={toggleLeftPanel}
            aria-label={panelToggleLabel}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors"
            style={{
              color: isLeftPanelOpen ? 'var(--accent-color)' : 'var(--text-secondary)',
              backgroundColor: isLeftPanelOpen ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : undefined,
            }}
          >
            <WandSparkles className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title={isStructureOpen ? t.tooltips.collapseRight : t.tooltips.showSidebar}>
          <button
            onClick={toggleStructurePanel}
            aria-label={isStructureOpen ? t.tooltips.collapseRight : t.tooltips.showSidebar}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors"
            style={{
              color: isStructureOpen ? 'var(--accent-color)' : 'var(--text-secondary)',
              backgroundColor: isStructureOpen ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : undefined,
            }}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Sparkles, Undo2, Redo2, PanelRight, Menu, KeyboardRegular, WandSparkles, Music, Check } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { IconButton } from '../ui/IconButton';
import { useTranslation } from '../../i18n';
import { useSongHistoryContext, useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useAppNavigationContext } from '../../contexts/AppStateContext';
import { useTopRibbonActions } from '../../hooks/useTopRibbonActions';
import { RibbonMenuPanel } from './RibbonMenuPanel';
import { RibbonTabs } from './RibbonTabs';
import { SUNO_CREATE_URL } from '../../constants/externalUrls';

/**
 * TopRibbon — assembly component (~100 lines).
 * Owns: burger state, right-side actions.
 * Delegates: <RibbonMenuPanel> (menu), <RibbonTabs> (tab strip).
 */
interface Props {
  hasApiKey: boolean;
  handleApiKeyHelp: () => void;
  onOpenNewGeneration: () => void;
  onOpenNewEmpty: () => void;
}

export function TopRibbon({ hasApiKey, handleApiKeyHelp, onOpenNewGeneration, onOpenNewEmpty }: Props) {
  const { past, future, undo, redo } = useSongHistoryContext();
  const { isGenerating, clearSelection } = useComposerContext();
  const { musicalPrompt } = useSongContext();
  const { activeTab, setActiveTab, isLeftPanelOpen, setIsLeftPanelOpen, isStructureOpen, setIsStructureOpen } = useAppNavigationContext();
  const { openKeyboardShortcuts, isAnalyzing } = useTopRibbonActions();
  const { t } = useTranslation();

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const isBusy = isGenerating || isAnalyzing;
  const processingLabel = t.tooltips.processing ?? 'Processing\u2026';
  const panelToggleLabel = isLeftPanelOpen
    ? (t.tooltips.closeLeftPanel ?? 'Close lyrics generation panel')
    : (t.tooltips.openLeftPanel ?? 'Open lyrics generation panel');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [sunoSent, setSunoSent] = useState(false);

  const toggleLeftPanel = () => {
    if (!isLeftPanelOpen) { setActiveTab('lyrics'); setIsStructureOpen(false); }
    setIsLeftPanelOpen(!isLeftPanelOpen);
  };
  const toggleStructurePanel = () => {
    const next = !isStructureOpen;
    if (next) clearSelection();
    setIsStructureOpen(next);
  };

  const handleSendToSuno = () => {
    const prompt = musicalPrompt.trim();
    const url = prompt
      ? `${SUNO_CREATE_URL}?prompt=${encodeURIComponent(prompt)}`
      : SUNO_CREATE_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSunoSent(true);
    setTimeout(() => setSunoSent(false), 2000);
  };

  return (
    <div
      className="h-16 border-b border-fluent-border flex items-center justify-between px-4 lg:px-8 lcars-ribbon lcars-ribbon-rail rounded-none border-t-0 border-l-0 border-r-0"
      style={{ position: 'relative', overflow: 'visible', backgroundColor: 'var(--bg-app, #0c0c0c)', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 20 }}
    >
      <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)', opacity: 0.85, pointerEvents: 'none', zIndex: 1 }} />

      <div className="flex items-center gap-3 lg:gap-6 pl-0">
        <div className="relative" style={{ zIndex: 60 }}>
          <Tooltip title={t.ribbon.menu ?? 'Menu'}>
            <button
              ref={menuButtonRef}
              onClick={() => setIsMenuOpen(v => !v)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-all duration-200"
              style={{ color: isMenuOpen ? 'var(--accent-color)' : 'var(--text-secondary)', backgroundColor: isMenuOpen ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)' : undefined }}
              aria-label={t.ribbon.menuAria ?? 'Open main menu'}
              aria-expanded={isMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
        {isMenuOpen && (
          <RibbonMenuPanel anchorRef={menuButtonRef} onClose={() => setIsMenuOpen(false)} onOpenNewGeneration={onOpenNewGeneration} onOpenNewEmpty={onOpenNewEmpty} />
        )}
        <div className="w-px h-6 bg-fluent-border opacity-40" />
        <RibbonTabs />
      </div>

      <div className="flex items-center gap-1 lg:gap-2">
        {isBusy && (
          <Tooltip title={processingLabel}>
            <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" aria-label={processingLabel.replace(/\u2026|\.{3}$/, '')} />
          </Tooltip>
        )}
        {!hasApiKey && (
          <Tooltip title={t.tooltips.aiUnavailableHelp}>
            <button onClick={handleApiKeyHelp} className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-lg hover:bg-amber-500/20 transition-all">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.ribbon.aiUnavailable}</span>
            </button>
          </Tooltip>
        )}
        {/* Send to SUNO button */}
        <Tooltip title={sunoSent ? (t.tooltips.sendToSuno ?? 'Opening SUNO…') : (t.tooltips.sendToSuno ?? 'Open SUNO with your musical prompt')}>
          <button
            onClick={handleSendToSuno}
            aria-label={t.ribbon.send_to_suno ?? 'Send to SUNO'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all"
            style={{
              background: sunoSent
                ? 'color-mix(in srgb, var(--lcars-cyan, #4f98a3) 12%, transparent)'
                : 'color-mix(in srgb, var(--lcars-violet, #a86fdf) 12%, transparent)',
              color: sunoSent ? 'var(--lcars-cyan, #4f98a3)' : 'var(--lcars-violet, #a86fdf)',
              border: `1px solid ${sunoSent ? 'color-mix(in srgb, var(--lcars-cyan, #4f98a3) 25%, transparent)' : 'color-mix(in srgb, var(--lcars-violet, #a86fdf) 25%, transparent)'}`,
            }}
          >
            {sunoSent
              ? <Check className="w-3.5 h-3.5" />
              : <Music className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{t.ribbon.send_to_suno ?? 'Send to SUNO'}</span>
          </button>
        </Tooltip>
        <div className="w-px h-4 bg-[var(--border-color)] mx-1 hidden lg:block" />
        <Tooltip title={t.tooltips.undo}>
          <IconButton onClick={undo} disabled={!canUndo} size="small" style={{ color: canUndo ? 'var(--accent-color)' : 'var(--text-secondary)', minWidth: 36, minHeight: 36 }} className={canUndo ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20' : 'opacity-40 saturate-0 cursor-not-allowed'} aria-disabled={!canUndo} aria-label={t.tooltips.undo}>
            <Undo2 className="w-4 h-4" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t.tooltips.redo}>
          <IconButton onClick={redo} disabled={!canRedo} size="small" style={{ color: canRedo ? 'var(--accent-color)' : 'var(--text-secondary)', minWidth: 36, minHeight: 36 }} className={canRedo ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20' : 'opacity-40 saturate-0 cursor-not-allowed'} aria-disabled={!canRedo} aria-label={t.tooltips.redo}>
            <Redo2 className="w-4 h-4" />
          </IconButton>
        </Tooltip>
        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
        <Tooltip title={t.tooltips.keyboardShortcuts}>
          <button onClick={openKeyboardShortcuts} aria-label={t.tooltips.keyboardShortcuts} className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <KeyboardRegular className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title={panelToggleLabel}>
          <button onClick={toggleLeftPanel} aria-label={panelToggleLabel} className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors" style={{ color: isLeftPanelOpen ? 'var(--accent-color)' : 'var(--text-secondary)', backgroundColor: isLeftPanelOpen ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : undefined }}>
            <WandSparkles className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip title={isStructureOpen ? t.tooltips.collapseRight : t.tooltips.showSidebar}>
          <button onClick={toggleStructurePanel} aria-label={isStructureOpen ? t.tooltips.collapseRight : t.tooltips.showSidebar} className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors" style={{ color: isStructureOpen ? 'var(--accent-color)' : 'var(--text-secondary)', backgroundColor: isStructureOpen ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : undefined }}>
            <PanelRight className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

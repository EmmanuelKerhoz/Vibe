import React from 'react';
import { Settings, BookOpen, Music, Menu, Sparkles } from '../ui/icons';
import { useTranslation } from '../../i18n';
import { useComposerContext } from '../../contexts/ComposerContext';

interface Props {
  isLeftPanelOpen: boolean;
  isStructureOpen: boolean;
  activeTab: 'lyrics' | 'musical';
  setIsLeftPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setIsStructureOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setActiveTab: (tab: 'lyrics' | 'musical') => void;
  onGenerateSong?: () => void;
  /** Opens the Settings dialog (not the generation panel) */
  onOpenSettings?: () => void;
}

export function MobileBottomNav({
  isLeftPanelOpen, isStructureOpen, activeTab,
  setIsLeftPanelOpen, setIsStructureOpen, setActiveTab,
  onGenerateSong,
  onOpenSettings,
}: Props) {
  const { isGenerating } = useComposerContext();
  const { t } = useTranslation();

  return (
    <nav className="mobile-bottom-nav" aria-label={t.mobileNav.navigation}>
      {/* Settings — onOpenSettings called first so React batch preserves the modal open state */}
      <button
        className="mobile-bottom-nav-btn"
        onClick={() => {
          onOpenSettings?.();
          setIsLeftPanelOpen(false);
          setIsStructureOpen(false);
        }}
        aria-label={t.mobileNav.settings}
      >
        <Settings size={20} />
        <span>{t.mobileNav.settings}</span>
      </button>

      {/* Lyrics tab */}
      <button
        className={`mobile-bottom-nav-btn ${activeTab === 'lyrics' && !isLeftPanelOpen && !isStructureOpen ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('lyrics');
          setIsLeftPanelOpen(false);
          setIsStructureOpen(false);
        }}
        aria-label={t.mobileNav.lyrics}
        aria-pressed={activeTab === 'lyrics'}
      >
        <BookOpen size={20} />
        <span>{t.mobileNav.lyrics}</span>
      </button>

      {/* Generate — centre CTA */}
      <button
        className="mobile-bottom-nav-btn mobile-bottom-nav-generate"
        onClick={() => {
          setIsLeftPanelOpen(false);
          setIsStructureOpen(false);
          onGenerateSong?.();
        }}
        disabled={isGenerating}
        aria-label={t.editor.emptyState.generateSong}
      >
        {isGenerating
          ? <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          : <Sparkles size={20} />}
        <span>Gen</span>
      </button>

      {/* Musical tab */}
      <button
        className={`mobile-bottom-nav-btn ${activeTab === 'musical' && !isLeftPanelOpen && !isStructureOpen ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('musical');
          setIsLeftPanelOpen(false);
          setIsStructureOpen(false);
        }}
        aria-label={t.mobileNav.music}
        aria-pressed={activeTab === 'musical'}
      >
        <Music size={20} />
        <span>{t.mobileNav.music}</span>
      </button>

      {/*
        FIX #4 (amend): open-only from here — closing is exclusively handled by
        StructureSidebar's handleClose (stopPropagation + setIsStructureOpen(false)).
        This prevents the ghost re-appearance caused by a rapid tap during the
        motion exit animation re-toggling the state from false back to true.
      */}
      <button
        className={`mobile-bottom-nav-btn ${isStructureOpen ? 'active' : ''}`}
        onClick={() => {
          if (!isStructureOpen) setIsStructureOpen(true);
          setIsLeftPanelOpen(false);
        }}
        aria-label={t.mobileNav.structure}
        aria-pressed={isStructureOpen}
      >
        <Menu size={20} />
        <span>{t.mobileNav.structure}</span>
      </button>
    </nav>
  );
}

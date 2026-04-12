import React from 'react';
import { Settings, BookOpen, Music, Menu, Sparkles } from '../ui/icons';
import { useTranslation } from '../../i18n';
import { useComposerContext } from '../../contexts/ComposerContext';

interface Props {
  isLeftPanelOpen: boolean;
  isStructureOpen: boolean;
  activeTab: 'lyrics' | 'musical';
  hasApiKey: boolean;
  setIsLeftPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setIsStructureOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setActiveTab: (tab: 'lyrics' | 'musical') => void;
  onGenerateSong?: () => void;
  /** Opens the Settings dialog (not the generation panel) */
  onOpenSettings?: () => void;
}

export function MobileBottomNav({
  isLeftPanelOpen, isStructureOpen, activeTab, hasApiKey,
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
        disabled={!hasApiKey || isGenerating}
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

      <button
        className={`mobile-bottom-nav-btn ${isStructureOpen ? 'active' : ''}`}
        onClick={() => {
          if (isStructureOpen) {
            setIsStructureOpen(false);
          } else {
            setIsStructureOpen(true);
            setIsLeftPanelOpen(false);
          }
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

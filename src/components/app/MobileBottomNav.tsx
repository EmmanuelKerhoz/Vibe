import React from 'react';
import { Settings, BookOpen, Music, Menu, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Props {
  isLeftPanelOpen: boolean;
  isStructureOpen: boolean;
  activeTab: 'lyrics' | 'musical';
  isGenerating?: boolean;
  /** Accept both direct boolean setter and functional updater */
  setIsLeftPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setIsStructureOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setActiveTab: (tab: 'lyrics' | 'musical') => void;
  onGenerateSong?: () => void;
}

export function MobileBottomNav({
  isLeftPanelOpen, isStructureOpen, activeTab,
  isGenerating,
  setIsLeftPanelOpen, setIsStructureOpen, setActiveTab,
  onGenerateSong,
}: Props) {
  const { t } = useTranslation();

  return (
    <nav className="mobile-bottom-nav" aria-label={t.mobileNav.navigation}>
      {/* Settings / New generation panel */}
      <button
        className={`mobile-bottom-nav-btn ${isLeftPanelOpen ? 'active' : ''}`}
        onClick={() => {
          setIsLeftPanelOpen(v => !v);
          setIsStructureOpen(false);
        }}
        aria-label={t.mobileNav.settings}
        aria-pressed={isLeftPanelOpen}
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

      {/* Structure sidebar */}
      <button
        className={`mobile-bottom-nav-btn ${isStructureOpen ? 'active' : ''}`}
        onClick={() => {
          setIsStructureOpen(v => !v);
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

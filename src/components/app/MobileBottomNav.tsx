import React from 'react';
import { Menu, BookOpen, Music, Settings } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Props {
  isLeftPanelOpen: boolean;
  isStructureOpen: boolean;
  activeTab: 'lyrics' | 'musical';
  /** Accept both direct boolean setter and functional updater */
  setIsLeftPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setIsStructureOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setActiveTab: (tab: 'lyrics' | 'musical') => void;
}

export function MobileBottomNav({
  isLeftPanelOpen, isStructureOpen, activeTab,
  setIsLeftPanelOpen, setIsStructureOpen, setActiveTab,
}: Props) {
  const { t } = useTranslation();

  return (
    <nav className="mobile-bottom-nav" aria-label={t.mobileNav.navigation}>
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
      <button
        className={`mobile-bottom-nav-btn ${activeTab === 'lyrics' ? 'active' : ''}`}
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
      <button
        className={`mobile-bottom-nav-btn ${activeTab === 'musical' ? 'active' : ''}`}
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

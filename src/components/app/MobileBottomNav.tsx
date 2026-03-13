import React from 'react';
import { Menu, BookOpen, Music, Settings } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Props {
  isLeftPanelOpen: boolean;
  isStructureOpen: boolean;
  activeTab: 'lyrics' | 'musical';
  setIsLeftPanelOpen: (fn: (v: boolean) => boolean) => void;
  setIsStructureOpen: (fn: (v: boolean) => boolean) => void;
  setActiveTab: (tab: 'lyrics' | 'musical') => void;
}

export function MobileBottomNav({
  isLeftPanelOpen, isStructureOpen, activeTab,
  setIsLeftPanelOpen, setIsStructureOpen, setActiveTab,
}: Props) {
  const { t } = useTranslation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation">
      <button
        className={`mobile-bottom-nav-btn ${isLeftPanelOpen ? 'active' : ''}`}
        onClick={() => { setIsLeftPanelOpen(v => !v); setIsStructureOpen(() => false); }}
        aria-label={t.nav.settings}
      >
        <Settings size={20} />
        <span>{t.nav.settings}</span>
      </button>
      <button
        className={`mobile-bottom-nav-btn ${activeTab === 'lyrics' ? 'active' : ''}`}
        onClick={() => setActiveTab('lyrics')}
        aria-label={t.nav.lyrics}
      >
        <BookOpen size={20} />
        <span>{t.nav.lyrics}</span>
      </button>
      <button
        className={`mobile-bottom-nav-btn ${activeTab === 'musical' ? 'active' : ''}`}
        onClick={() => setActiveTab('musical')}
        aria-label={t.nav.music}
      >
        <Music size={20} />
        <span>{t.nav.music}</span>
      </button>
      <button
        className={`mobile-bottom-nav-btn ${isStructureOpen ? 'active' : ''}`}
        onClick={() => { setIsStructureOpen(v => !v); setIsLeftPanelOpen(() => false); }}
        aria-label={t.nav.structure}
      >
        <Menu size={20} />
        <span>{t.nav.structure}</span>
      </button>
    </nav>
  );
}

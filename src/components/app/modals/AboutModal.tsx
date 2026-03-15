import React, { useEffect, useRef } from 'react';
import { Apple, Music, Youtube, ExternalLink, Linkedin, Radio, ShoppingBag, Info, X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { APP_VERSION } from '../../../version';
import { AI_KEY_ENV_VAR, AI_MODEL_NAME } from '../../../utils/aiUtils';
import { Button } from '../../ui/Button';
import bannerImage from '../../../../docs/Lyricist_Splash_Medium.png';

const BANNER_WIDTH = 1200;
const BANNER_HEIGHT = 630;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const bodyRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const sweepItemsRef = useRef<HTMLDivElement>(null);

  // Diagonal sweep line (BG→HD) fires once on open, then per-item shimmer stagger
  useEffect(() => {
    if (!isOpen) return;

    // Full-panel diagonal sweep
    const el = sweepRef.current;
    if (el) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'about-glass-sweep 3000ms cubic-bezier(0.4, 0, 0.2, 1) 300ms forwards';
    }

    // Per-item shimmer — activate sweep-active class so paused animations run
    const container = sweepItemsRef.current;
    if (container) {
      const items = container.querySelectorAll<HTMLElement>('.about-sweep-item');
      items.forEach((item) => {
        item.classList.remove('sweep-active');
        // Force reflow to restart animation
        void item.offsetWidth;
        item.classList.add('sweep-active');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
        <div className="w-[600px] h-[400px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full" />
      </div>

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.app.name}
        className="relative w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 glass-panel border border-white/10 rounded-none sm:rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden dark:border-white/8"
      >
        {/* Diagonal sweep overlay — BG→HD (bottom-left → top-right) — fires once on open */}
        <div
          ref={sweepRef}
          aria-hidden="true"
          className="about-glass-sweep-overlay"
        />

        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
              <Info className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                {t.app.name}
              </h3>
              <p className="text-xs text-[var(--accent-color)] uppercase tracking-wider mt-0.5">
                {APP_VERSION} · VoxNova42
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.about.close}
            className="ux-interactive p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Banner — flush, no dark overlay */}
          <div className="relative w-full">
            <div className="w-full overflow-hidden" style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}>
              <img src={bannerImage} alt="Lyricist splash screen" className="w-full h-full object-contain object-top" />
            </div>
          </div>

          {/* Body content — ref container for per-item shimmer sweep */}
          <div ref={sweepItemsRef} className="px-8 pt-0 pb-8 space-y-6">
            <p className="about-sweep-item text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto text-center rounded-lg">
              {t.about.description}
            </p>

            {/* Tech Info — each card is an about-sweep-item */}
            <div className="grid grid-cols-1 gap-3 pt-4 border-t border-[var(--border-color)] sm:grid-cols-2">
              <div className="about-sweep-item flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.about.engineLabel}</span>
                <span className="text-xs text-[var(--text-primary)] telemetry-text">{t.about.engine}</span>
              </div>
              <div className="about-sweep-item flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.about.modelLabel}</span>
                <span className="text-xs text-[var(--text-primary)] telemetry-text break-all text-center">{AI_MODEL_NAME}</span>
              </div>
              <div className="about-sweep-item flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.about.apiKeyLabel}</span>
                <span className="text-xs text-[var(--text-primary)] telemetry-text break-all text-center">{AI_KEY_ENV_VAR}</span>
              </div>
              <div className="about-sweep-item flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.about.licenseLabel}</span>
                <span className="text-xs text-[var(--text-primary)] telemetry-text">{t.about.license}</span>
              </div>
            </div>

            {/* Social Links — each link is an about-sweep-item */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a href="https://www.youtube.com/@voxnova42" target="_blank" rel="noopener noreferrer" aria-label="Visit YouTube channel"
                className="about-sweep-item ux-interactive flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium">
                <Youtube className="w-4 h-4" /><span>YouTube</span><ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a href="https://open.spotify.com/artist/6VfhDlWsBW0qk0a8x7UbOM?si=UtpaOQ5JT3iN1mUb2vN7vg&nd=1&dlsi=1dffb43b3c7d4280" target="_blank" rel="noopener noreferrer" aria-label="Visit Spotify artist page"
                className="about-sweep-item ux-interactive flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300 rounded-lg text-xs font-medium">
                <Music className="w-4 h-4" /><span>Spotify</span><ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a href="https://www.linkedin.com/in/emmanuelkerhoz/" target="_blank" rel="noopener noreferrer" aria-label="Visit LinkedIn profile"
                className="about-sweep-item ux-interactive flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 hover:text-sky-300 rounded-lg text-xs font-medium">
                <Linkedin className="w-4 h-4" /><span>LinkedIn</span><ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a href="https://network.landr.com/users/emmanueldk" target="_blank" rel="noopener noreferrer" aria-label="Visit Landr profile"
                className="about-sweep-item ux-interactive flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 hover:text-violet-300 rounded-lg text-xs font-medium">
                <Radio className="w-4 h-4" /><span>Landr</span><ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a href="https://music.amazon.com/artists/B0DKW3BNL7/emmanuel-kerhoz" target="_blank" rel="noopener noreferrer" aria-label="Visit Amazon Music artist page"
                className="about-sweep-item ux-interactive flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-medium">
                <ShoppingBag className="w-4 h-4" /><span>Amazon</span><ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a href="https://music.apple.com/artist/emmanuel-kerhoz/1776965137" target="_blank" rel="noopener noreferrer" aria-label="Visit Apple Music artist page"
                className="about-sweep-item ux-interactive flex items-center gap-2 px-4 py-2 bg-[var(--bg-app)] hover:bg-[var(--bg-sidebar)] border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-xs font-medium">
                <Apple className="w-4 h-4" /><span>Apple Music</span><ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end flex-shrink-0">
          <Button onClick={onClose} variant="contained" color="primary" className="ux-interactive">
            {t.about.close}
          </Button>
        </div>
      </div>
    </div>
  );
}

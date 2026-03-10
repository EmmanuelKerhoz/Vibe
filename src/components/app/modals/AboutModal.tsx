import React from 'react';
import { Apple, Music, Youtube, ExternalLink, Linkedin, Radio, ShoppingBag, Info, X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { APP_VERSION } from '../../../version';
import { AI_KEY_ENV_VAR, AI_MODEL_NAME } from '../../../utils/aiUtils';
import { Button } from '../../ui/Button';
import bannerImage from '../../../../docs/Lyricist_Splash_Medium.png';

const BANNER_WIDTH = 1366;
const BANNER_HEIGHT = 580;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Ambient glow – dark theme only */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
        <div className="w-[600px] h-[400px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full" />
      </div>

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px_8px_24px_8px] shadow-2xl overflow-hidden">

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
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Banner */}
          <div className="relative w-full bg-black/70">
            <div className="w-full" style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}>
              <img src={bannerImage} alt="Lyricist splash screen" className="w-full h-full object-contain" />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0), var(--bg-card))' }}
            />
          </div>

          <div className="p-8 space-y-6">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto text-center">
              {t.about.description}
            </p>

            {/* Tech Info */}
            <div className="grid grid-cols-1 gap-3 pt-4 border-t border-[var(--border-color)] sm:grid-cols-2">
              <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.about.engineLabel}</span>
                <span className="text-xs text-[var(--text-primary)] telemetry-text">{t.about.engine}</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.about.modelLabel}</span>
                <span className="text-xs text-[var(--text-primary)] telemetry-text break-all text-center">{AI_MODEL_NAME}</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.about.apiKeyLabel}</span>
                <span className="text-xs text-[var(--text-primary)] telemetry-text break-all text-center">{AI_KEY_ENV_VAR}</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.about.licenseLabel}</span>
                <span className="text-xs text-[var(--text-primary)] telemetry-text">{t.about.license}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="https://www.youtube.com/@voxnova42"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit YouTube channel"
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-lg transition-all text-xs font-medium"
              >
                <Youtube className="w-4 h-4" />
                <span>YouTube</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a
                href="https://open.spotify.com/artist/6VfhDlWsBW0qk0a8x7UbOM?si=UtpaOQ5JT3iN1mUb2vN7vg&nd=1&dlsi=1dffb43b3c7d4280"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Spotify artist page"
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300 rounded-lg transition-all text-xs font-medium"
              >
                <Music className="w-4 h-4" />
                <span>Spotify</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a
                href="https://www.linkedin.com/in/emmanuelkerhoz/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit LinkedIn profile"
                className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 hover:text-sky-300 rounded-lg transition-all text-xs font-medium"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a
                href="https://network.landr.com/users/emmanueldk"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Landr profile"
                className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 hover:text-violet-300 rounded-lg transition-all text-xs font-medium"
              >
                <Radio className="w-4 h-4" />
                <span>Landr</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a
                href="https://music.amazon.com/artists/B0DKW3BNL7/emmanuel-kerhoz"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Amazon Music artist page"
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-lg transition-all text-xs font-medium"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Amazon</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a
                href="https://music.apple.com/artist/emmanuel-kerhoz/1776965137"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Apple Music artist page"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-app)] hover:bg-[var(--bg-sidebar)] border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-all text-xs font-medium"
              >
                <Apple className="w-4 h-4" />
                <span>Apple Music</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end flex-shrink-0">
          <Button onClick={onClose} variant="contained" color="primary">
            {t.about.close}
          </Button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Music, Youtube, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../../../i18n';
import { APP_VERSION } from '../../../version';
import bannerImage from '../../../../docs/Lyricist_Splash_Medium.png';

const ABOUT_MODAL_VIEWPORT_MARGIN = '2rem';
const BANNER_WIDTH = 1366;
const BANNER_HEIGHT = 580;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl overflow-y-auto overflow-x-hidden bg-fluent-card border border-fluent-border shadow-2xl lcars-panel"
            style={{ maxHeight: `calc(100vh - ${ABOUT_MODAL_VIEWPORT_MARGIN})` }}
          >
            {/* Banner */}
            <div className="w-full bg-black/70">
              <div className="w-full" style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}>
                <img src={bannerImage} alt="Lyricist splash screen" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl text-primary tracking-tight font-bold">{t.app.name}</h2>
                <p className="text-sm telemetry-text text-[var(--accent-color)]">{APP_VERSION} by VoxNova42</p>
              </div>
              
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
                {t.about.description}
              </p>

              {/* Tech Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-fluent-border">
                <div className="flex flex-col items-center gap-1">
                  <span className="micro-label text-zinc-500">{t.about.engineLabel}</span>
                  <span className="text-xs text-zinc-400 telemetry-text">{t.about.engine}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="micro-label text-zinc-500">{t.about.licenseLabel}</span>
                  <span className="text-xs text-zinc-400 telemetry-text">{t.about.license}</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <a
                  href="https://www.youtube.com/@voxnova42"
                  target="_blank"
                  rel="noopener noreferrer"
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
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300 rounded-lg transition-all text-xs font-medium"
                >
                  <Music className="w-4 h-4" />
                  <span>Spotify</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 mt-4 bg-[var(--accent-color)] hover:brightness-110 text-[var(--on-accent-color)] rounded-xl transition-all shadow-lg shadow-[var(--accent-color)]/20 font-medium"
              >
                {t.about.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import React from 'react';
import { Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../../../i18n';
import { APP_VERSION } from '../../../version';

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
            className="relative w-full max-w-md bg-fluent-card border border-fluent-border shadow-2xl overflow-hidden lcars-panel"
          >
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center shadow-inner">
                <Music className="w-10 h-10 text-[var(--accent-color)]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl text-primary tracking-tight">{t.app.name}</h2>
                <p className="text-xs telemetry-text text-[var(--accent-color)]">{APP_VERSION} by VoxNova42</p>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{t.about.description}</p>
              <div className="pt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between micro-label text-zinc-500 border-t border-fluent-border pt-4">
                  <span>{t.about.engineLabel}</span>
                  <span className="text-zinc-400 telemetry-text">{t.about.engine}</span>
                </div>
                <div className="flex items-center justify-between micro-label text-zinc-500">
                  <span>{t.about.licenseLabel}</span>
                  <span className="text-zinc-400 telemetry-text">{t.about.license}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-[var(--accent-color)] hover:brightness-110 text-[var(--on-accent-color)] rounded-xl transition-all shadow-lg shadow-[var(--accent-color)]/20"
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

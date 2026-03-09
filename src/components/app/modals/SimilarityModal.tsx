import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useTranslation } from '../../../i18n';
import type { SimilarityMatch } from '../../../utils/similarityUtils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  matches: SimilarityMatch[];
  candidateCount: number;
};

export function SimilarityModal({ isOpen, onClose, matches, candidateCount }: Props) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="acrylic w-full max-w-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 lcars-panel">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="space-y-1">
            <h3 className="text-lg text-zinc-100 flex items-center gap-2.5">
              <Search className="w-5 h-5 text-[var(--accent-color)]" />
              {t.similarity.title}
            </h3>
            <p className="text-sm text-zinc-400">{t.similarity.subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-6">
          <div className="rounded-2xl border border-[var(--accent-color)]/20 bg-[var(--accent-color)]/5 px-4 py-3 text-sm text-zinc-300">
            {t.similarity.thresholdHint}
          </div>

          {candidateCount === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/10 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center">
                <Search className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-500">{t.similarity.noCandidates}</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/10 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center">
                <Search className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-500">{t.similarity.empty}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <article key={match.versionId} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-base font-medium text-zinc-100">
                        {match.title || match.versionName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                        <span>{match.versionName}</span>
                        <span>{new Date(match.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
                      {t.similarity.score}: {match.score}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/5 bg-black/10 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{t.similarity.sharedWords}</div>
                      <div className="mt-1 text-lg font-medium text-zinc-100">{match.sharedWords}</div>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/10 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{t.similarity.sharedLines}</div>
                      <div className="mt-1 text-lg font-medium text-zinc-100">{match.sharedLines}</div>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/10 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{t.similarity.matchedSections}</div>
                      <div className="mt-1 text-lg font-medium text-zinc-100">{match.matchedSections.length}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">{t.similarity.sharedKeywords}</div>
                    <div className="flex flex-wrap gap-2">
                      {match.sharedKeywords.length > 0 ? match.sharedKeywords.map(keyword => (
                        <span key={keyword} className="rounded-full border border-[var(--accent-color)]/20 bg-[var(--accent-color)]/10 px-2.5 py-1 text-xs text-[var(--accent-color)]">
                          {keyword}
                        </span>
                      )) : (
                        <span className="text-sm text-zinc-500">—</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">{t.similarity.matchedSections}</div>
                    <div className="flex flex-wrap gap-2">
                      {match.matchedSections.length > 0 ? match.matchedSections.map(section => (
                        <span key={`${match.versionId}-${section.name}`} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300">
                          {section.name} · {section.score}%
                        </span>
                      )) : (
                        <span className="text-sm text-zinc-500">—</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
          <Button onClick={onClose} variant="outlined" color="inherit">
            {t.analysis.close}
          </Button>
        </div>
      </div>
    </div>
  );
}

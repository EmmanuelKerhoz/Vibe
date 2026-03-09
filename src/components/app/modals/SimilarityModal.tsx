import React from 'react';
import { Search, X, Activity } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Intense Glassmorphism Backdrop with Cosmic/Cyberpunk ambient glow */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl animate-in fade-in duration-300" onClick={onClose} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[800px] h-[600px] bg-[var(--accent-color)]/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute w-[600px] h-[400px] bg-purple-500/20 blur-[150px] rounded-full mix-blend-screen translate-x-32 -translate-y-32" />
      </div>

      {/* Glassmorphic + LCARS Asymmetrical Panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-500 
                      glass-panel rounded-[48px_8px_48px_8px]">
        
        {/* Glow border effect over the asymmetrical shape */}
        <div className="absolute inset-0 border-t border-l border-white/30 rounded-[48px_8px_48px_8px] pointer-events-none" />

        {/* Header - LCARS style horizontal block */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-8 bg-[var(--accent-color)] rounded-[16px_4px_4px_16px] flex items-center justify-center shadow-[0_0_15px_var(--accent-color)]">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 uppercase">
                {t.similarity.title}
              </h3>
              <p className="text-xs text-[var(--accent-color)] uppercase tracking-widest">{t.similarity.subtitle || t.similarity.thresholdHint}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white glass-button rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-6 relative z-10">
          
          <div className="rounded-[16px_4px_16px_4px] border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 backdrop-blur-md px-5 py-4 text-sm text-zinc-200 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-color)] shadow-[0_0_10px_var(--accent-color)] animate-pulse" />
            {t.similarity.thresholdHint}
          </div>

          {candidateCount === 0 || matches.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/20 rounded-[24px_8px_24px_8px] bg-black/20 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <Search className="w-8 h-8 text-[var(--accent-color)]" />
              </div>
              <p className="text-sm text-zinc-400 uppercase tracking-widest">
                {candidateCount === 0 ? t.similarity.noCandidates : t.similarity.empty}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {matches.map((match, i) => (
                <article key={match.versionId} 
                  className="group relative rounded-[24px_8px_24px_8px] glass-panel p-6 transition-all duration-300 hover:border-white/30 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Hover gradient effect inside card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/0 via-[var(--accent-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between relative z-10">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2 tracking-wide drop-shadow-md">
                        {match.title || match.versionName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-[var(--accent-color)]">
                        <span className="glass-panel px-3 py-1 rounded-[8px_2px_8px_2px]">{match.versionName}</span>
                        <span className="text-zinc-400">{new Date(match.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Score display - LCARS Bar style */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400">{t.similarity.score}</div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                          <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]" style={{ width: `${match.score}%` }} />
                        </div>
                        <span className="text-xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">{match.score}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-6 relative z-10">
                    <div className="rounded-[12px_4px_12px_4px] border border-white/10 bg-black/20 backdrop-blur-lg p-4 flex flex-col justify-center transition-all group-hover:border-white/20 group-hover:bg-white/5 shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">{t.similarity.sharedWords}</div>
                      <div className="text-2xl font-light text-white font-mono drop-shadow-md">{match.sharedWords}</div>
                    </div>
                    <div className="rounded-[12px_4px_12px_4px] border border-white/10 bg-black/20 backdrop-blur-lg p-4 flex flex-col justify-center transition-all group-hover:border-white/20 group-hover:bg-white/5 shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">{t.similarity.sharedLines}</div>
                      <div className="text-2xl font-light text-white font-mono drop-shadow-md">{match.sharedLines}</div>
                    </div>
                    <div className="rounded-[12px_4px_12px_4px] border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 backdrop-blur-lg p-4 flex flex-col justify-center shadow-[inset_0_0_15px_rgba(var(--accent-color-rgb),0.1)] transition-all group-hover:bg-[var(--accent-color)]/20">
                      <div className="text-[10px] uppercase tracking-widest text-white mb-2">{t.similarity.matchedSections}</div>
                      <div className="text-2xl font-light text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{match.matchedSections.length}</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 relative z-10">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">{t.similarity.sharedKeywords}</div>
                      <div className="flex flex-wrap gap-2">
                        {match.sharedKeywords.length > 0 ? match.sharedKeywords.map(keyword => (
                          <span key={keyword} className="rounded-[8px_2px_8px_2px] glass-panel px-3 py-1.5 text-xs font-medium text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-colors hover:bg-white/20">
                            {keyword}
                          </span>
                        )) : (
                          <span className="text-sm text-zinc-600 font-mono">—</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">{t.similarity.matchedSections}</div>
                      <div className="flex flex-wrap gap-2">
                        {match.matchedSections.length > 0 ? match.matchedSections.map(section => (
                          <span key={`${match.versionId}-${section.name}`} className="flex items-center gap-2 rounded-[8px_2px_8px_2px] border border-[var(--accent-color)]/30 bg-black/40 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur-md shadow-[inset_0_0_8px_rgba(var(--accent-color-rgb),0.1)]">
                            <span className="uppercase tracking-wider font-bold text-white">{section.name}</span>
                            <span className="w-1 h-1 rounded-full bg-[var(--accent-color)] shadow-[0_0_5px_var(--accent-color)]" />
                            <span className="font-mono text-[var(--accent-color)] font-bold">{section.score}%</span>
                          </span>
                        )) : (
                          <span className="text-sm text-zinc-600 font-mono">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-md flex justify-end relative z-10">
          <Button onClick={onClose} variant="contained" color="primary" className="rounded-[16px_4px_16px_4px] shadow-[0_0_20px_rgba(var(--accent-color-rgb),0.4)] backdrop-blur-md border border-white/20">
            {t.settings.actions.close}
          </Button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  X, BarChart2, Sparkles, Loader2, BookOpen, Activity, CheckCircle2, Target,
  Music, Plus, Check, Undo2
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';
import type { SongVersion } from '../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isAnalyzing: boolean;
  analysisReport: {
    theme: string;
    emotionalArc: string;
    strengths: string[];
    improvements: string[];
    musicalSuggestions: string[];
    summary: string;
  } | null;
  analysisSteps: string[];
  appliedAnalysisItems: Set<string>;
  selectedAnalysisItems: Set<string>;
  isApplyingAnalysis: string | null;
  toggleAnalysisItemSelection: (item: string) => void;
  applySelectedAnalysisItems: () => void;
  clearAppliedAnalysisItems: () => void;
  versions: SongVersion[];
  rollbackToVersion: (v: SongVersion) => void;
}

export function AnalysisModal({
  isOpen, onClose,
  isAnalyzing, analysisReport, analysisSteps,
  appliedAnalysisItems, selectedAnalysisItems, isApplyingAnalysis,
  toggleAnalysisItemSelection, applySelectedAnalysisItems,
  clearAppliedAnalysisItems, versions, rollbackToVersion,
}: Props) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="acrylic w-full max-w-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 lcars-panel">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-lg text-zinc-100 flex items-center gap-2.5">
            <BarChart2 className="w-5 h-5 text-[var(--accent-color)]" />
            {t.analysis.title}
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          {isAnalyzing ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[var(--accent-color)]/10 border-t-[var(--accent-color)] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[var(--accent-color)] animate-pulse" />
                </div>
              </div>
              <div className="space-y-3 text-center">
                <h4 className="text-xl font-medium text-zinc-100">{t.analysis.deepAnalysis}</h4>
                <div className="flex flex-col items-center gap-2">
                  {analysisSteps.map((step, idx) => (
                    <p key={idx} className={`text-sm transition-all duration-500 ${idx === analysisSteps.length - 1 ? 'text-[var(--accent-color)] font-medium scale-110' : 'text-zinc-500 opacity-50'}`}>{step}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : analysisReport ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="space-y-3">
                <h4 className="micro-label text-[var(--accent-color)] flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />{t.analysis.theme}
                </h4>
                <p className="text-zinc-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">{analysisReport.theme}</p>
              </section>
              <section className="space-y-3">
                <h4 className="micro-label text-[var(--accent-color)] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />{t.analysis.emotionalArc}
                </h4>
                <p className="text-zinc-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">{analysisReport.emotionalArc}</p>
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="space-y-3">
                  <h4 className="micro-label text-emerald-500 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />{t.analysis.strengths}
                  </h4>
                  <ul className="space-y-2">
                    {analysisReport.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-2"><span className="text-emerald-500 mt-1">•</span>{s}</li>
                    ))}
                  </ul>
                </section>
                <section className="space-y-3">
                  <h4 className="micro-label text-amber-500 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" />{t.analysis.improvements}
                  </h4>
                  <ul className="space-y-3">
                    {analysisReport.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <button
                          onClick={() => !appliedAnalysisItems.has(s) && toggleAnalysisItemSelection(s)}
                          disabled={isApplyingAnalysis !== null || appliedAnalysisItems.has(s)}
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${appliedAnalysisItems.has(s) ? 'bg-emerald-500 border-emerald-500 text-white' : selectedAnalysisItems.has(s) ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white' : 'border-white/20 hover:border-amber-500/50 group-hover:bg-amber-500/10'}`}
                        >
                          {(appliedAnalysisItems.has(s) || selectedAnalysisItems.has(s)) ? <Check className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-amber-500/50" />}
                        </button>
                        <span className={`text-sm leading-relaxed transition-colors ${appliedAnalysisItems.has(s) ? 'text-zinc-500 line-through' : selectedAnalysisItems.has(s) ? 'text-zinc-200' : 'text-zinc-400'}`}>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              <section className="space-y-3">
                <h4 className="micro-label text-blue-500 flex items-center gap-2">
                  <Music className="w-3.5 h-3.5" />{t.analysis.musicalSuggestions}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisReport.musicalSuggestions.map((s, i) => (
                    <div key={i} onClick={() => !appliedAnalysisItems.has(s) && toggleAnalysisItemSelection(s)}
                      className={`text-xs p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 group ${appliedAnalysisItems.has(s) ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-500' : selectedAnalysisItems.has(s) ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/30 text-zinc-200' : 'bg-blue-500/5 border-blue-500/10 text-zinc-400 hover:bg-blue-500/10 hover:border-blue-500/30'}`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${appliedAnalysisItems.has(s) ? 'bg-emerald-500 border-emerald-500 text-white' : selectedAnalysisItems.has(s) ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white' : 'border-white/20 group-hover:border-blue-500/50'}`}>
                        {(appliedAnalysisItems.has(s) || selectedAnalysisItems.has(s)) ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />}
                      </div>
                      <span className={appliedAnalysisItems.has(s) ? 'line-through' : ''}>{s}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="pt-6 border-t border-white/5">
                <div className="bg-[var(--accent-color)]/5 border border-[var(--accent-color)]/20 p-5 rounded-2xl">
                  <h4 className="text-sm font-medium text-[var(--accent-color)] mb-2">{t.analysis.summary}</h4>
                  <p className="text-sm text-zinc-300 italic leading-relaxed">"{analysisReport.summary}"</p>
                </div>
              </section>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <p className="text-zinc-500">{t.analysis.noData}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-4">
            {appliedAnalysisItems.size > 0 && (
              <Tooltip title={t.tooltips.revertAnalysis}>
                <button
                  onClick={() => {
                    const beforeVersion = versions.find(v =>
                      v.name === 'Before Analysis Improvements' || v.name === 'Before Analysis Batch Improvements'
                    );
                    if (beforeVersion) rollbackToVersion(beforeVersion);
                    clearAppliedAnalysisItems();
                  }}
                  className="text-[10px] uppercase tracking-widest text-amber-500 hover:text-amber-400 flex items-center gap-2 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  {t.analysis.revert}
                </button>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedAnalysisItems.size > 0 && (
              <Tooltip title={t.tooltips.applyAnalysis}>
                <Button
                  onClick={applySelectedAnalysisItems}
                  variant="contained" color="success"
                  disabled={isApplyingAnalysis !== null}
                  startIcon={isApplyingAnalysis === 'batch' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                >
                  {t.analysis.apply} ({selectedAnalysisItems.size})
                </Button>
              </Tooltip>
            )}
            <Tooltip title={t.tooltips.closeAnalysis}>
              <Button onClick={onClose} variant="outlined" color="inherit" disabled={isAnalyzing || isApplyingAnalysis !== null}>
                {t.analysis.close}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

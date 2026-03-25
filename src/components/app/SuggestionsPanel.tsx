import React from 'react';
import { X, Lightbulb, Sparkles, Hash, RefreshCw, Check } from '../ui/icons';
import { useTranslation } from '../../i18n';

interface Props {
  selectedLineId: string | null;
  setSelectedLineId: (id: string | null) => void;
  suggestions: string[];
  isSuggesting: boolean;
  applySuggestion: (s: string) => void;
  generateSuggestions: (lineId: string) => void;
  isMobileOverlay?: boolean;
  className?: string;
}

export function SuggestionsPanel({
  selectedLineId, setSelectedLineId,
  suggestions, isSuggesting,
  applySuggestion, generateSuggestions,
  isMobileOverlay = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const panelClassName = [
    'border-l border-fluent-border bg-fluent-sidebar flex flex-col z-50 shadow-2xl',
    'lcars-panel fluent-animate-panel !rounded-none !border-t-0 !border-b-0 !border-r-0',
    className,
  ].filter(Boolean).join(' ');

  if (!selectedLineId) return null;

  return (
    <div
      className={panelClassName}
      style={{ overflow: 'visible' }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: -1,
        bottom: 0,
        width: '2px',
        background: 'linear-gradient(180deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
        opacity: 0.85,
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      <div className="w-[280px] flex flex-col h-full overflow-hidden">
        <div
          className="h-16 px-5 flex items-center justify-between shrink-0"
          style={{ position: 'relative', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}
        >
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--accent-rail-thickness, 2px)',
            background: 'var(--accent-rail-gradient-h-rev)',
            opacity: 0.85,
            pointerEvents: 'none',
            zIndex: 1,
          }} />
          <h3 className="micro-label text-zinc-400 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[var(--accent-warning)]" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">{t.suggestions.title}</span>
          </h3>
          <button
            onClick={() => setSelectedLineId(null)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded"
            aria-label={isMobileOverlay ? 'Close suggestions panel' : 'Clear line suggestions'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {isSuggesting ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-color)]/20 border-t-[var(--accent-color)] animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-[var(--accent-color)] animate-pulse" />
              </div>
              <p className="text-xs text-zinc-500 animate-pulse">{t.suggestions.crafting}</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { applySuggestion(suggestion); setSelectedLineId(null); }}
                  aria-label={`Apply suggestion: ${suggestion}`}
                  className="group w-full p-4 text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[var(--accent-color)]/30 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white leading-relaxed">{suggestion}</p>
                  <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-[var(--accent-color)] uppercase tracking-wider">{t.suggestions.clickToApply}</span>
                    <Check className="w-3 h-3 text-[var(--accent-color)]" />
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => generateSuggestions(selectedLineId)}
                aria-label="Generate more suggestions"
                className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-[var(--accent-color)] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {t.suggestions.moreOptions}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20">
              <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center">
                <Hash className="w-6 h-6 text-zinc-800" />
              </div>
              <p className="text-xs text-zinc-500">{t.suggestions.empty}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

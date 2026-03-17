import React from 'react';
import { X, Lightbulb, Sparkles, Hash, RefreshCw, Check } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface Props {
  selectedLineId: string | null;
  setSelectedLineId: (id: string | null) => void;
  suggestions: string[];
  isSuggesting: boolean;
  applySuggestion: (s: string) => void;
  generateSuggestions: (lineId: string) => void;
}

export function SuggestionsPanel({
  selectedLineId, setSelectedLineId,
  suggestions, isSuggesting,
  applySuggestion, generateSuggestions,
}: Props) {
  const { t } = useTranslation();

  if (!selectedLineId) return null;

  return (
    <div className="absolute right-8 top-24 bottom-8 w-80 acrylic rounded-2xl shadow-3xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 lcars-suggestions">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[var(--accent-warning)]" />
          {t.suggestions.title}
        </h3>
        <button
          onClick={() => setSelectedLineId(null)}
          className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
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
              <div
                key={idx}
                onClick={() => { applySuggestion(suggestion); setSelectedLineId(null); }}
                className="group p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[var(--accent-color)]/30 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white leading-relaxed">{suggestion}</p>
                <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] text-[var(--accent-color)] uppercase tracking-wider">{t.suggestions.clickToApply}</span>
                  <Check className="w-3 h-3 text-[var(--accent-color)]" />
                </div>
              </div>
            ))}
            <button
              onClick={() => generateSuggestions(selectedLineId)}
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
  );
}

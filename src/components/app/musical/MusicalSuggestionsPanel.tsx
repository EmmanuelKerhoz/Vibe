import React from 'react';
import { Music } from '../../ui/icons';
import { useTranslation } from '../../../i18n';
import { useAnalysisContext } from '../../../contexts/AnalysisContext';

/**
 * Displays musical suggestions from the Song Analysis Report
 * inside the Musical tab, preventing the AnalysisModal from overflowing.
 */
export function MusicalSuggestionsPanel() {
  const { t } = useTranslation();
  const { analysisReport } = useAnalysisContext();

  const suggestions = Array.isArray(analysisReport?.musicalSuggestions)
    ? analysisReport!.musicalSuggestions
    : [];

  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h4 className="micro-label text-blue-500 flex items-center gap-2">
        <Music className="w-3.5 h-3.5" />
        {t.analysis.musicalSuggestions}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="text-xs p-3 rounded-lg border bg-blue-500/5 border-blue-500/10 text-[var(--text-secondary)]"
          >
            {s}
          </div>
        ))}
      </div>
    </section>
  );
}

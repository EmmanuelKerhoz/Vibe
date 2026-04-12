import { Loader2, Search } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';
import { useSimilarityContext } from '../../../contexts/SimilarityContext';

interface SimilarityButtonProps {
  isGenerating: boolean;
  isAnalyzing: boolean;
  hasLyrics: boolean;
  hasApiKey: boolean;
  webBadgeLabel: string | null;
  libraryCount: number;
  setIsSimilarityModalOpen: (open: boolean) => void;
}

export function SimilarityButton({
  isGenerating,
  isAnalyzing,
  hasLyrics,
  hasApiKey,
  webBadgeLabel,
  libraryCount,
  setIsSimilarityModalOpen,
}: SimilarityButtonProps) {
  const { t } = useTranslation();
  // Read index directly from SimilarityContext to avoid re-rendering
  // the InsightsBar subtree on every similarity engine run.
  const { index: webSimilarityIndex } = useSimilarityContext();
  const isDisabled = !hasApiKey || isGenerating || isAnalyzing || !hasLyrics;
  const tooltipTitle = !hasApiKey
    ? (t.tooltips.aiUnavailable ?? 'AI unavailable')
    : 'Compare with existing published songs and your saved library versions';

  return (
    <Tooltip title={tooltipTitle}>
      <button
        onClick={() => setIsSimilarityModalOpen(true)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className="px-2 lg:px-3 py-1 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative"
      >
        {webSimilarityIndex.status === 'running'
          ? (<>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)]" aria-hidden="true" />
              <span className="sr-only">{t.editor.checkingSimilarityLabel ?? 'Checking similarity…'}</span>
            </>)
          : <Search className="w-3.5 h-3.5" aria-hidden="true" />}
        <span className="hidden lg:inline">{t.ribbon?.similarity || 'Similarity'}</span>
        {webBadgeLabel && (
          <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded-sm text-[9px] text-[var(--accent-color)]" aria-hidden="true">{webBadgeLabel}</span>
        )}
        {!webBadgeLabel && libraryCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent-color)]/20 rounded-sm text-[9px]" aria-hidden="true">{libraryCount}</span>
        )}
      </button>
    </Tooltip>
  );
}

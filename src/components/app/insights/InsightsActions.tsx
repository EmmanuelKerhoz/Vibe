import { Search } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { getLanguageDisplay, useTranslation } from '../../../i18n';
import type { useSimilarityEngine } from '../../../hooks/useSimilarityEngine';
import { AnalyzeSongButton } from './AnalyzeSongButton';
import { SimilarityButton } from './SimilarityButton';

type LanguageDisplay = ReturnType<typeof getLanguageDisplay>;

interface InsightsActionsProps {
  webSimilarityIndex: ReturnType<typeof useSimilarityEngine>['index'];
  webBadgeLabel: string | null;
  libraryCount: number;
  isAnalyzing: boolean;
  isGenerating: boolean;
  hasLyrics: boolean;
  hasApiKey: boolean;
  detectedDisplays: LanguageDisplay[];
  analyzeCurrentSong: () => void;
  setIsSimilarityModalOpen: (open: boolean) => void;
  onOpenSearch: () => void;
}

export function InsightsActions({
  webSimilarityIndex,
  webBadgeLabel,
  libraryCount,
  isAnalyzing,
  isGenerating,
  hasLyrics,
  hasApiKey,
  analyzeCurrentSong,
  setIsSimilarityModalOpen,
  onOpenSearch,
}: InsightsActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
      <span className="hidden lg:inline micro-label text-zinc-500 whitespace-nowrap mr-0.5">{t.editor.lyricsInsights ?? 'INSIGHTS'}</span>
      <AnalyzeSongButton isGenerating={isGenerating} isAnalyzing={isAnalyzing} hasLyrics={hasLyrics} onAnalyze={analyzeCurrentSong} hasApiKey={hasApiKey} />
      <SimilarityButton
        isGenerating={isGenerating}
        isAnalyzing={isAnalyzing}
        hasLyrics={hasLyrics}
        webSimilarityIndex={webSimilarityIndex}
        webBadgeLabel={webBadgeLabel}
        libraryCount={libraryCount}
        setIsSimilarityModalOpen={setIsSimilarityModalOpen}
        hasApiKey={hasApiKey}
      />
      <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
      <Tooltip title={t.tooltips.openSearch}>
        <button
          onClick={onOpenSearch}
          aria-label={t.tooltips.openSearch}
          className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}

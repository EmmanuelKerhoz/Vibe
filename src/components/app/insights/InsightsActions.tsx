import { getLanguageDisplay, useTranslation } from '../../../i18n';
import type { useSimilarityEngine } from '../../../hooks/useSimilarityEngine';
import { AnalyzeSongButton } from './AnalyzeSongButton';
import { DetectLanguageButton } from './DetectLanguageButton';
import { SimilarityButton } from './SimilarityButton';

type LanguageDisplay = ReturnType<typeof getLanguageDisplay>;

interface InsightsActionsProps {
  webSimilarityIndex: ReturnType<typeof useSimilarityEngine>['index'];
  webBadgeLabel: string | null;
  libraryCount: number;
  isDetectingLanguage: boolean;
  isAnalyzing: boolean;
  isGenerating: boolean;
  hasLyrics: boolean;
  detectedDisplays: LanguageDisplay[];
  detectLanguage: () => void;
  analyzeCurrentSong: () => void;
  setIsSimilarityModalOpen: (open: boolean) => void;
}

export function InsightsActions({
  webSimilarityIndex,
  webBadgeLabel,
  libraryCount,
  isDetectingLanguage,
  isAnalyzing,
  isGenerating,
  hasLyrics,
  detectedDisplays,
  detectLanguage,
  analyzeCurrentSong,
  setIsSimilarityModalOpen,
}: InsightsActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
      <span className="hidden lg:inline micro-label text-zinc-500 whitespace-nowrap mr-0.5">{t.editor.lyricsInsights ?? 'INSIGHTS'}</span>
      <DetectLanguageButton detectedDisplays={detectedDisplays} hasLyrics={hasLyrics} isDetectingLanguage={isDetectingLanguage} onDetect={detectLanguage} />
      <AnalyzeSongButton isGenerating={isGenerating} isAnalyzing={isAnalyzing} hasLyrics={hasLyrics} onAnalyze={analyzeCurrentSong} />
      <SimilarityButton
        isGenerating={isGenerating}
        isAnalyzing={isAnalyzing}
        hasLyrics={hasLyrics}
        webSimilarityIndex={webSimilarityIndex}
        webBadgeLabel={webBadgeLabel}
        libraryCount={libraryCount}
        setIsSimilarityModalOpen={setIsSimilarityModalOpen}
      />
    </div>
  );
}

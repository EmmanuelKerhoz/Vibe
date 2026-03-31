import { getLanguageDisplay, useTranslation } from '../../../i18n';
import type { useSimilarityEngine } from '../../../hooks/useSimilarityEngine';
import type { Section } from '../../../types';
import { AnalyzeSongButton } from './AnalyzeSongButton';
import { DetectLanguageButton } from './DetectLanguageButton';
import { SimilarityButton } from './SimilarityButton';
import { TranslateGroup } from './TranslateGroup';

type LanguageDisplay = ReturnType<typeof getLanguageDisplay>;

interface InsightsActionsProps {
  webSimilarityIndex: ReturnType<typeof useSimilarityEngine>['index'];
  webBadgeLabel: string | null;
  libraryCount: number;
  isDetectingLanguage: boolean;
  isAnalyzing: boolean;
  isGenerating: boolean;
  hasLyrics: boolean;
  hasApiKey: boolean;
  detectedDisplays: LanguageDisplay[];
  detectLanguage: () => void;
  analyzeCurrentSong: () => void;
  setIsSimilarityModalOpen: (open: boolean) => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isAdaptingLanguage: boolean;
  adaptSongLanguage: (lang: string) => void;
  showTranslationFeatures: boolean;
  song: Section[];
}

export function InsightsActions({
  webSimilarityIndex,
  webBadgeLabel,
  libraryCount,
  isDetectingLanguage,
  isAnalyzing,
  isGenerating,
  hasLyrics,
  hasApiKey,
  detectedDisplays,
  detectLanguage,
  analyzeCurrentSong,
  setIsSimilarityModalOpen,
  targetLanguage,
  setTargetLanguage,
  isAdaptingLanguage,
  adaptSongLanguage,
  showTranslationFeatures,
  song,
}: InsightsActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
      <span className="hidden lg:inline micro-label text-zinc-500 whitespace-nowrap mr-0.5">{t.editor.lyricsInsights ?? 'INSIGHTS'}</span>
      <TranslateGroup
        targetLanguage={targetLanguage}
        setTargetLanguage={setTargetLanguage}
        isAdaptingLanguage={isAdaptingLanguage}
        song={song}
        adaptSongLanguage={adaptSongLanguage}
        showTranslationFeatures={showTranslationFeatures}
        hasApiKey={hasApiKey}
      />
      <DetectLanguageButton detectedDisplays={detectedDisplays} hasLyrics={hasLyrics} isDetectingLanguage={isDetectingLanguage} onDetect={detectLanguage} hasApiKey={hasApiKey} />
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
    </div>
  );
}

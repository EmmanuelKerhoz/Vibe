import type { useSimilarityEngine } from '../../../hooks/useSimilarityEngine';
import type { AdaptationProgress, AdaptationResult } from '../../../hooks/analysis/useLanguageAdapter';
import type { EditMode } from '../../../types';

export interface InsightsBarProps {
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isAdaptingLanguage: boolean;
  isDetectingLanguage: boolean;
  isAnalyzing: boolean;
  editMode: EditMode;
  switchEditMode: (target: EditMode) => void;
  webSimilarityIndex: ReturnType<typeof useSimilarityEngine>['index'];
  webBadgeLabel: string | null;
  libraryCount: number;
  adaptSongLanguage: (lang: string) => void;
  detectLanguage: () => void;
  analyzeCurrentSong: () => void;
  setIsSimilarityModalOpen: (open: boolean) => void;
  hasApiKey: boolean;
  isMetronomeActive?: boolean;
  toggleMetronome?: () => void;
  adaptationProgress?: AdaptationProgress;
  adaptationResult?: AdaptationResult | null;
  showTranslationFeatures?: boolean;
}

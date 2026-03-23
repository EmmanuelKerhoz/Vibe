import { useMemo } from 'react';
import type { Section } from '../types';
import type { WebSimilarityIndex } from '../types/webSimilarity';
import { isPristineDraft, DEFAULT_TOPIC, DEFAULT_MOOD } from '../utils/songDefaults';

interface UseDerivedAppStateParams {
  song: Section[];
  structure: string[];
  rhymeScheme: string;
  topic: string;
  mood: string;
  isMarkupMode: boolean;
  markupText: string;
  webSimilarityIndex: WebSimilarityIndex;
}

export function useDerivedAppState({
  song,
  structure,
  rhymeScheme,
  topic,
  mood,
  isMarkupMode,
  markupText,
  webSimilarityIndex,
}: UseDerivedAppStateParams) {
  const hasRealLyricContent = useMemo(
    () => song.some((s: Section) => s.lines.some(l => !l.isMeta && l.text.trim().length > 0)),
    [song]
  );

  const hasExistingWork = useMemo(
    () => (hasRealLyricContent && !isPristineDraft(song, structure, rhymeScheme))
      || topic !== DEFAULT_TOPIC || mood !== DEFAULT_MOOD || (isMarkupMode && markupText.trim().length > 0),
    [hasRealLyricContent, song, structure, rhymeScheme, topic, mood, isMarkupMode, markupText]
  );

  const webBadgeLabel = useMemo(
    () => webSimilarityIndex.status === 'done'
      && webSimilarityIndex.candidates[0]?.score !== undefined
      ? `${webSimilarityIndex.candidates[0].score}%`
      : null,
    [webSimilarityIndex.candidates, webSimilarityIndex.status]
  );

  return {
    hasRealLyricContent,
    hasExistingWork,
    webBadgeLabel,
  };
}

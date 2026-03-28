import { useMemo } from 'react';
import type { WebSimilarityIndex } from '../types/webSimilarity';
import type { EditMode } from '../types';
import { isPristineDraft, DEFAULT_TOPIC, DEFAULT_MOOD } from '../utils/songDefaults';
import { useSongContext } from '../contexts/SongContext';

interface UseDerivedAppStateParams {
  editMode: EditMode;
  markupText: string;
  webSimilarityIndex: WebSimilarityIndex;
}

export function useDerivedAppState({
  editMode,
  markupText,
  webSimilarityIndex,
}: UseDerivedAppStateParams) {
  const { song, structure, rhymeScheme, topic, mood } = useSongContext();

  const hasRealLyricContent = useMemo(
    () => song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0)),
    [song]
  );

  const hasExistingWork = useMemo(
    () =>
      (hasRealLyricContent && !isPristineDraft(song, structure, rhymeScheme)) ||
      topic !== DEFAULT_TOPIC ||
      mood !== DEFAULT_MOOD ||
      ((editMode === 'text' || editMode === 'markdown') && markupText.trim().length > 0), // phonetic & section modes are read-only views
    [hasRealLyricContent, song, structure, rhymeScheme, topic, mood, editMode, markupText]
  );

  const webBadgeLabel = useMemo(
    () =>
      webSimilarityIndex.status === 'done' &&
      webSimilarityIndex.candidates[0]?.score !== undefined
        ? `${webSimilarityIndex.candidates[0].score}%`
        : null,
    [webSimilarityIndex.candidates, webSimilarityIndex.status]
  );

  return { hasRealLyricContent, hasExistingWork, webBadgeLabel };
}

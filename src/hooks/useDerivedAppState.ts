import { useMemo } from 'react';
import type { WebSimilarityIndex } from '../types/webSimilarity';
import type { EditMode } from '../types';
import { isPristineDraft, DEFAULT_TOPIC, DEFAULT_MOOD } from '../utils/songDefaults';
import { useSongHistoryContext } from '../contexts/SongHistoryContext';
import { useSongMetaContext } from '../contexts/SongMetaContext';

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
  const { song, structure } = useSongHistoryContext();
  const { rhymeScheme, topic, mood } = useSongMetaContext();

  const hasRealLyricContent = useMemo(
    () => song.some(s => s.lines.some(l => !l.isMeta && l.text.trim().length > 0)),
    [song]
  );

  const hasExistingWork = useMemo(
    () =>
      (hasRealLyricContent && !isPristineDraft(song, structure, rhymeScheme)) ||
      topic !== DEFAULT_TOPIC ||
      mood !== DEFAULT_MOOD ||
      (editMode !== 'section' && markupText.trim().length > 0),
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

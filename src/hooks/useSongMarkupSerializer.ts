import { useCallback } from 'react';
import { useSongContext } from '../contexts/SongContext';
import { serializeSongToMarkup } from '../utils/markupParser';

export function useSongMarkupSerializer() {
  const { song } = useSongContext();

  const serializeSong = useCallback(
    () => serializeSongToMarkup(song),
    [song],
  );

  return { song, serializeSong };
}

/**
 * useAppState — barrel re-export.
 * Consumers continue to call useAppState() and destructure freely.
 * Song meta (title, topic, mood, etc.) is owned by SongContext/useSongMeta —
 * do NOT call useSongMeta() here to avoid a second independent instance.
 *
 * @version 3.4.0
 */
import { useUIState } from './useUIState';
import { useSessionState } from './useSessionState';

export { useUIState } from './useUIState';
export { useSongMeta } from './useSongMeta';
export { useSessionState } from './useSessionState';

export function useAppState() {
  const ui = useUIState();
  const session = useSessionState();

  return {
    ...ui,
    ...session,
  };
}

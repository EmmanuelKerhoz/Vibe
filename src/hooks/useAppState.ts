/**
 * useAppState — aggregates UI state and session/infra state.
 * Song meta (title, topic, mood, songLanguage, rhymeScheme, genre, tempo, etc.)
 * is owned exclusively by SongContext — use useSongContext() for those.
 *
 * @version 3.4.0
 */
import { useUIState } from './useUIState';
import { useSessionState } from './useSessionState';

export { useUIState } from './useUIState';

export function useAppState() {
  const ui = useUIState();
  const session = useSessionState();

  return {
    ...ui,
    ...session,
  };
}

/**
 * useAppState — barrel re-export.
 * Consumers continue to call useAppState() and destructure freely.
 *
 * Includes:
 * - useUIState()      → modals, navigation, markup editor, refs
 * - useSessionState() → theme, API key, audio, UI scale, library
 * - useSongMeta()     → title, topic, mood, rhymeScheme, song params
 *
 * Song history (song/structure/undo-redo) is owned by useSongHistoryState(),
 * called directly in AppInnerContent — NOT part of this barrel.
 *
 * @version 3.17.47
 */
import { useUIState } from './useUIState';
import { useSessionState } from './useSessionState';
import { useSongMeta } from './useSongMeta';

export { useUIState } from './useUIState';
export { useSongMeta } from './useSongMeta';
export { useSessionState } from './useSessionState';

export function useAppState() {
  const ui = useUIState();
  const session = useSessionState();
  const songMeta = useSongMeta();

  return {
    ...ui,
    ...session,
    ...songMeta,
  };
}

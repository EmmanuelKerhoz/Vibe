/**
 * useAppState — barrel re-export.
 * Consumers continue to call useAppState() and destructure freely.
 * Internal state is now managed by 3 domain hooks.
 * Note: useMusicalMeta has been merged into useSongMeta.
 *
 * @version 3.3.0
 */
import { useUIState } from './useUIState';
import { useSongMeta, useMusicalMeta } from './useSongMeta';
import { useSessionState } from './useSessionState';

export { useUIState } from './useUIState';
export { useSongMeta, useMusicalMeta } from './useSongMeta';
export { useSessionState } from './useSessionState';

export function useAppState() {
  const ui = useUIState();
  const meta = useSongMeta(); // Now includes musical metadata
  const session = useSessionState();

  return {
    ...ui,
    ...meta,
    ...session,
  };
}

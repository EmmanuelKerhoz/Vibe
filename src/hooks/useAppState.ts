/**
 * useAppState — barrel re-export.
 * Consumers continue to call useAppState() and destructure freely.
 * Internal state is now managed by 3 domain hooks.
 *
 * @version 3.3.0
 */
import { useUIState } from './useUIState';
import { useSongMeta } from './useSongMeta';
import { useSessionState } from './useSessionState';

export { useUIState } from './useUIState';
export { useSongMeta } from './useSongMeta';
export { useSessionState } from './useSessionState';

export function useAppState() {
  // useUIState is the internal base hook for UI-only state; external consumers should continue to use useAppState().
  const ui = useUIState();
  const meta = useSongMeta();
  const session = useSessionState();

  return {
    ...ui,
    ...meta,
    ...session,
  };
}

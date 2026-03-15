/**
 * useAppState — barrel re-export.
 * Consumers continue to call useAppState() and destructure freely.
 * Internal state is now managed by 4 domain hooks.
 *
 * @version 3.3.0
 */
import { useUIState } from './useUIState';
import { useSongMeta } from './useSongMeta';
import { useMusicalMeta } from './useMusicalMeta';
import { useSessionState } from './useSessionState';

export { useUIState } from './useUIState';
export { useSongMeta } from './useSongMeta';
export { useMusicalMeta } from './useMusicalMeta';
export { useSessionState } from './useSessionState';

export function useAppState() {
  const ui = useUIState();
  const meta = useSongMeta();
  const musical = useMusicalMeta();
  const session = useSessionState();

  return {
    ...ui,
    ...meta,
    ...musical,
    ...session,
  };
}

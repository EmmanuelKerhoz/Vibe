/**
 * useAppState — aggregates UI state and session/infra state.
 *
 * navInitial seeds activeTab/isStructureOpen/isLeftPanelOpen from OPFS.
 * hasSavedSessionInit seeds the dot indicator immediately on restore.
 *
 * @version 3.4.2
 */
import { useUIState } from './useUIState';
import { useSessionState } from './useSessionState';
import type { NavInitial } from './useUIState';

export { useUIState } from './useUIState';

export interface AppStateInit {
  navInitial?: NavInitial;
  hasSavedSessionInit?: boolean;
}

export function useAppState(init?: AppStateInit) {
  const ui = useUIState(init?.navInitial);
  const session = useSessionState(init?.hasSavedSessionInit);

  return {
    ...ui,
    ...session,
  };
}

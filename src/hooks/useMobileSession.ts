/**
 * useMobileSession
 *
 * Owns the mobile/tablet detection and the closeMobilePanels callback
 * previously inlined in AppInnerContent.
 *
 * Accepts setters as parameters to remain decoupled from panel state
 * internals — call-site (AppInnerContent) passes them from useEditorPanelState.
 */
import { useCallback } from 'react';
import { useMobileLayout } from './useMobileLayout';
import { useMobileInitPanels } from './useMobileInitPanels';
import { useComposerContext } from '../contexts/ComposerContext';

interface MobileSessionOptions {
  setIsLeftPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setIsStructureOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export interface MobileSessionState {
  isMobile: boolean;
  isTablet: boolean;
  isMobileOrTablet: boolean;
  closeMobilePanels: () => void;
}

export function useMobileSession({
  setIsLeftPanelOpen,
  setIsStructureOpen,
}: MobileSessionOptions): MobileSessionState {
  const { isMobile, isTablet } = useMobileLayout();
  const isMobileOrTablet = isMobile || isTablet;

  const { setSelectedLineId } = useComposerContext();

  useMobileInitPanels({ isMobileOrTablet, setIsLeftPanelOpen, setIsStructureOpen });

  const closeMobilePanels = useCallback(() => {
    setIsLeftPanelOpen(false);
    setIsStructureOpen(false);
    setSelectedLineId(null);
  }, [setIsLeftPanelOpen, setIsStructureOpen, setSelectedLineId]);

  return { isMobile, isTablet, isMobileOrTablet, closeMobilePanels };
}

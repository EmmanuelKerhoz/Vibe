/**
 * useEditorPanelState
 *
 * Owns all panel open/close state and derived callbacks that were
 * previously inlined in AppInnerContent:
 *   - isStructureOpen + setIsStructureOpenAndClearLine
 *   - isLeftPanelOpen
 *   - isSuggestionsOpen (derived from activeTab + selectedLineId)
 *   - showBackdrop (derived)
 *
 * Depends on useAppNavigationContext and useComposerContext.
 */
import { useCallback, useMemo } from 'react';
import { useAppNavigationContext } from '../contexts/AppStateContext';
import { useComposerContext } from '../contexts/ComposerContext';

export interface EditorPanelState {
  isStructureOpen: boolean;
  setIsStructureOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  activeTab: 'lyrics' | 'musical';
  setActiveTab: (tab: 'lyrics' | 'musical') => void;
  isSuggestionsOpen: boolean;
  setIsStructureOpenAndClearLine: (value: boolean | ((prev: boolean) => boolean)) => void;
  showBackdrop: (isMobileOrTablet: boolean) => boolean;
}

export function useEditorPanelState(): EditorPanelState {
  const {
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
  } = useAppNavigationContext();

  const { selectedLineId, setSelectedLineId } = useComposerContext();

  const isSuggestionsOpen = useMemo(
    () => activeTab === 'lyrics' && Boolean(selectedLineId),
    [activeTab, selectedLineId],
  );

  const setIsStructureOpenAndClearLine = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsStructureOpen(prev => {
        const next = typeof value === 'function' ? value(prev) : value;
        if (next) setSelectedLineId(null);
        return next;
      });
    },
    [setIsStructureOpen, setSelectedLineId],
  );

  const showBackdrop = useCallback(
    (isMobileOrTablet: boolean) =>
      isMobileOrTablet && (isLeftPanelOpen || isStructureOpen || isSuggestionsOpen),
    [isLeftPanelOpen, isStructureOpen, isSuggestionsOpen],
  );

  return {
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    isSuggestionsOpen,
    setIsStructureOpenAndClearLine,
    showBackdrop,
  };
}

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
  type MutableRefObject,
} from 'react';
import { useDragHandlers } from '../hooks/useDragHandlers';

type PlayAudioFeedback = (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;

export interface DragHandlersContextValue {
  handleDrop: (targetIndex: number) => void;
  handleLineDragStart: (sectionId: string, lineId: string) => void;
  handleLineDrop: (targetSectionId: string, targetLineId: string) => void;
}

const DragHandlersContext = createContext<DragHandlersContextValue | null>(null);

interface DragHandlersProviderProps {
  children: ReactNode;
  playAudioFeedbackRef: MutableRefObject<PlayAudioFeedback | null>;
}

export function DragHandlersProvider({
  children,
  playAudioFeedbackRef,
}: DragHandlersProviderProps) {
  const { handleDrop, handleLineDragStart, handleLineDrop } = useDragHandlers({
    playAudioFeedbackRef,
  });

  const value = useMemo(
    () => ({ handleDrop, handleLineDragStart, handleLineDrop }),
    [handleDrop, handleLineDragStart, handleLineDrop],
  );

  return (
    <DragHandlersContext.Provider value={value}>
      {children}
    </DragHandlersContext.Provider>
  );
}

export function useDragHandlersContext(): DragHandlersContextValue {
  const ctx = useContext(DragHandlersContext);
  if (!ctx) throw new Error('useDragHandlersContext must be used inside <DragHandlersProvider>');
  return ctx;
}

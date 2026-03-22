import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { LineDragInfo } from '../types';

type DragIndexState = number | null;

export interface DragContextValue {
  draggedItemIndex: DragIndexState;
  setDraggedItemIndex: Dispatch<SetStateAction<DragIndexState>>;
  dragOverIndex: DragIndexState;
  setDragOverIndex: Dispatch<SetStateAction<DragIndexState>>;
  draggedLineInfo: LineDragInfo;
  setDraggedLineInfo: Dispatch<SetStateAction<LineDragInfo>>;
  dragOverLineInfo: LineDragInfo;
  setDragOverLineInfo: Dispatch<SetStateAction<LineDragInfo>>;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedItemIndex, setDraggedItemIndex] = useState<DragIndexState>(null);
  const [dragOverIndex, setDragOverIndex] = useState<DragIndexState>(null);
  const [draggedLineInfo, setDraggedLineInfo] = useState<LineDragInfo>(null);
  const [dragOverLineInfo, setDragOverLineInfo] = useState<LineDragInfo>(null);

  const value = useMemo(() => ({
    draggedItemIndex,
    setDraggedItemIndex,
    dragOverIndex,
    setDragOverIndex,
    draggedLineInfo,
    setDraggedLineInfo,
    dragOverLineInfo,
    setDragOverLineInfo,
  }), [draggedItemIndex, dragOverIndex, draggedLineInfo, dragOverLineInfo]);

  return (
    <DragContext.Provider value={value}>
      {children}
    </DragContext.Provider>
  );
}

export function useDrag(): DragContextValue {
  const context = useContext(DragContext);
  if (!context) throw new Error('useDrag must be used inside <DragProvider>');
  return context;
}

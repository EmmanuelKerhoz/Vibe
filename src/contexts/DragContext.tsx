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

export type DragStateContextValue = Pick<
  DragContextValue,
  'draggedItemIndex' | 'dragOverIndex' | 'draggedLineInfo' | 'dragOverLineInfo'
>;

export type DragActionsContextValue = Pick<
  DragContextValue,
  'setDraggedItemIndex' | 'setDragOverIndex' | 'setDraggedLineInfo' | 'setDragOverLineInfo'
>;

const DragStateContext = createContext<DragStateContextValue | null>(null);
const DragActionsContext = createContext<DragActionsContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedItemIndex, setDraggedItemIndex] = useState<DragIndexState>(null);
  const [dragOverIndex, setDragOverIndex] = useState<DragIndexState>(null);
  const [draggedLineInfo, setDraggedLineInfo] = useState<LineDragInfo>(null);
  const [dragOverLineInfo, setDragOverLineInfo] = useState<LineDragInfo>(null);

  const state = useMemo(() => ({
    draggedItemIndex,
    dragOverIndex,
    draggedLineInfo,
    dragOverLineInfo,
  }), [draggedItemIndex, dragOverIndex, draggedLineInfo, dragOverLineInfo]);

  const actions = useMemo(() => ({
    setDraggedItemIndex,
    setDragOverIndex,
    setDraggedLineInfo,
    setDragOverLineInfo,
  }), []);

  return (
    <DragActionsContext.Provider value={actions}>
      <DragStateContext.Provider value={state}>
        {children}
      </DragStateContext.Provider>
    </DragActionsContext.Provider>
  );
}

export function useDragState(): DragStateContextValue {
  const context = useContext(DragStateContext);
  if (!context) throw new Error('useDragState must be used inside <DragProvider>');
  return context;
}

export function useDragActions(): DragActionsContextValue {
  const context = useContext(DragActionsContext);
  if (!context) throw new Error('useDragActions must be used inside <DragProvider>');
  return context;
}

export function useDrag(): DragContextValue {
  const state = useDragState();
  const actions = useDragActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

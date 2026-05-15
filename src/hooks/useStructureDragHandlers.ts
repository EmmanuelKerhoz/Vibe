import { useCallback } from 'react';
import { useDragActions, useDragState } from '../contexts/DragContext';
import { useDragHandlersContext } from '../contexts/DragHandlersContext';
import { isAnchoredStartSection, isAnchoredEndSection } from '../constants/sections';

export type StructureDragHandlers = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'onDragStart' | 'onDragOver' | 'onDragEnter' | 'onDragLeave' | 'onDrop'
>;

interface UseStructureDragHandlersArgs {
  structure: string[];
}

/**
 * Returns a stable `makeDragHandlers(itemIndex, draggable)` factory.
 * All shared drag state is captured in closure — no per-call arg drilling.
 */
export function useStructureDragHandlers({ structure }: UseStructureDragHandlersArgs) {
  const { handleDrop } = useDragHandlersContext();
  const { draggedItemIndex, dragOverIndex } = useDragState();
  const { setDraggedItemIndex, setDragOverIndex } = useDragActions();

  const structureLength = structure.length;
  const hasAnchoredStart = isAnchoredStartSection(structure[0] ?? '');
  const hasAnchoredEnd = isAnchoredEndSection(structure[structureLength - 1] ?? '');

  const makeDragHandlers = useCallback(
    (itemIndex: number, draggable: boolean): StructureDragHandlers => ({
      onDragStart: () => {
        if (draggable) setDraggedItemIndex(itemIndex);
      },
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedItemIndex === null || draggedItemIndex === itemIndex) return;
        if (itemIndex === 0 && hasAnchoredStart) return;
        if (itemIndex === structureLength - 1 && hasAnchoredEnd) return;
        setDragOverIndex(itemIndex);
      },
      onDragEnter: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onDragLeave: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverIndex(null);
      },
      onDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDrop(itemIndex);
      },
    }),
    [draggedItemIndex, structureLength, hasAnchoredStart, hasAnchoredEnd,
     setDraggedItemIndex, setDragOverIndex, handleDrop],
  );

  return { makeDragHandlers, draggedItemIndex, dragOverIndex };
}

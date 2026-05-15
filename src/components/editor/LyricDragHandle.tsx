import React from 'react';
import { GripVertical } from '../ui/icons';
import { useDragActions } from '../../contexts/DragContext';
import { useDragHandlersContext } from '../../contexts/DragHandlersContext';

interface LyricDragHandleProps {
  sectionId: string;
  lineId: string;
  onDragEnd: () => void;
}

export const LyricDragHandle = React.memo(function LyricDragHandle({
  sectionId,
  lineId,
  onDragEnd,
}: LyricDragHandleProps) {
  const { setDragOverLineInfo } = useDragActions();
  const { handleLineDragStart } = useDragHandlersContext();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    handleLineDragStart(sectionId, lineId);
  };

  const handleDragEnd = () => {
    onDragEnd();
    setDragOverLineInfo(null);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-80 flex-shrink-0 touch-none transition-opacity"
    >
      <GripVertical className="h-3.5 w-3.5 text-zinc-500" />
    </div>
  );
});

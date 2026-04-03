import { useCallback, type MutableRefObject } from 'react';
import type { Section } from '../types';
import { useDrag } from '../contexts/DragContext';
import { useSongContext } from '../contexts/SongContext';
import {
  isAnchoredEndSection,
  isAnchoredStartSection,
} from '../constants/sections';
import { getTiedSectionRange } from './useSectionManager';

type PlayAudioFeedback = (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;

type UseDragHandlersParams = {
  playAudioFeedbackRef: MutableRefObject<PlayAudioFeedback | null>;
};

export const useDragHandlers = ({
  playAudioFeedbackRef,
}: UseDragHandlersParams) => {
  const { song, structure, updateState, updateSongAndStructureWithHistory } = useSongContext();
  const {
    draggedItemIndex,
    setDraggedItemIndex,
    setDragOverIndex,
    draggedLineInfo,
    setDraggedLineInfo,
    setDragOverLineInfo,
  } = useDrag();

  const updateSong = useCallback((transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({
      song: transform(current.song),
      structure: current.structure,
    }));
  }, [updateState]);

  const handleDrop = useCallback((dropIndex: number) => {
    setDragOverIndex(null);
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
    const draggedRange = getTiedSectionRange(structure, draggedItemIndex);
    const targetRange = getTiedSectionRange(structure, dropIndex);
    if (targetRange.start >= draggedRange.start && targetRange.start <= draggedRange.end) return;
    const draggedBlockLength = draggedRange.end - draggedRange.start + 1;
    const canonicalDropIndex = draggedRange.start < targetRange.start ? targetRange.end : targetRange.start;

    const draggedItemName = structure[draggedRange.start];
    if (!draggedItemName) return;
    const getBaseAndNumber = (name: string) => {
      const match = name.match(/^(.+?)\s+(\d+)$/);
      if (match) return { base: match[1]!, num: parseInt(match[2]!, 10) };
      return { base: name, num: null };
    };
    const draggedInfo = getBaseAndNumber(draggedItemName);
    if (isAnchoredStartSection(draggedItemName) && targetRange.start !== 0) return;
    if (isAnchoredEndSection(draggedItemName)) {
      if (targetRange.start !== structure.length - 1) return;
    } else {
      const anchoredEndIndex = structure.findIndex(isAnchoredEndSection);
      if (anchoredEndIndex !== -1) {
        if (targetRange.start > anchoredEndIndex && draggedRange.start !== anchoredEndIndex) return;
        if (draggedRange.start === anchoredEndIndex && targetRange.start !== structure.length - 1) return;
      }
    }
    const tempStructure = [...structure];
    const draggedBlock = tempStructure.splice(draggedRange.start, draggedBlockLength);
    let insertIndex = canonicalDropIndex;
    if (insertIndex > draggedRange.end) insertIndex -= draggedBlockLength - 1;
    tempStructure.splice(insertIndex, 0, ...draggedBlock);
    if (draggedInfo.num !== null) {
      const numberedSectionsByBase = new Map<string, number[]>();
      for (const name of tempStructure) {
        const { base, num } = getBaseAndNumber(name);
        if (num === null) continue;
        const numbers = numberedSectionsByBase.get(base) ?? [];
        const lastNumber = numbers.at(-1);
        if (lastNumber !== undefined && lastNumber > num) return;
        numbers.push(num);
        numberedSectionsByBase.set(base, numbers);
      }
    }
    const newStructure = [...structure];
    const movedBlock = newStructure.splice(draggedRange.start, draggedBlockLength);
    newStructure.splice(insertIndex, 0, ...movedBlock);
    const newSong = [...song];
    if (newSong.length > 0) {
      const movedSections = newSong.splice(draggedRange.start, draggedBlockLength);
      newSong.splice(insertIndex, 0, ...movedSections);
    }
    updateSongAndStructureWithHistory(newSong, newStructure);
    setDraggedItemIndex(null);
  }, [draggedItemIndex, structure, song, setDragOverIndex, setDraggedItemIndex, updateSongAndStructureWithHistory]);

  const handleLineDragStart = useCallback((sectionId: string, lineId: string) => {
    setDraggedLineInfo({ sectionId, lineId });
    playAudioFeedbackRef.current?.('drag');
  }, [setDraggedLineInfo, playAudioFeedbackRef]);

  const handleLineDrop = useCallback((targetSectionId: string, targetLineId: string) => {
    setDragOverLineInfo(null);
    if (!draggedLineInfo) return;
    if (draggedLineInfo.sectionId === targetSectionId && draggedLineInfo.lineId === targetLineId) {
      setDraggedLineInfo(null);
      return;
    }
    updateSong(currentSong => {
      const sourceSectionIndex = currentSong.findIndex(s => s.id === draggedLineInfo.sectionId);
      const targetSectionIndex = currentSong.findIndex(s => s.id === targetSectionId);
      if (sourceSectionIndex === -1 || targetSectionIndex === -1) return currentSong;

      const sourceSection = currentSong[sourceSectionIndex]!;
      const targetSection = currentSong[targetSectionIndex]!;

      const sourceLineIndex = sourceSection.lines.findIndex(l => l.id === draggedLineInfo.lineId);
      const targetLineIndex = targetSection.lines.findIndex(l => l.id === targetLineId);
      // Guard: findIndex returns -1 if the line was removed between drag start and drop
      // (e.g. concurrent undo). Non-null assertions below are safe only after this check.
      if (sourceLineIndex === -1 || targetLineIndex === -1) return currentSong;

      const draggedLine = sourceSection.lines[sourceLineIndex];
      if (!draggedLine) return currentSong;

      const newSourceLines = sourceSection.lines.filter((_, i) => i !== sourceLineIndex);

      const isSameSection = sourceSectionIndex === targetSectionIndex;
      const targetLines = isSameSection ? newSourceLines : targetSection.lines;
      const effectiveTargetIndex = isSameSection
        ? targetSection.lines.findIndex(l => l.id === targetLineId) > sourceLineIndex
          ? targetLineIndex - 1
          : targetLineIndex
        : targetLineIndex;
      const newTargetLines = [
        ...targetLines.slice(0, effectiveTargetIndex),
        draggedLine,
        ...targetLines.slice(effectiveTargetIndex),
      ];

      return currentSong.map((section, i) => {
        if (isSameSection && i === sourceSectionIndex) {
          return { ...section, lines: newTargetLines };
        }
        if (!isSameSection && i === sourceSectionIndex) {
          return { ...section, lines: newSourceLines };
        }
        if (!isSameSection && i === targetSectionIndex) {
          return { ...section, lines: newTargetLines };
        }
        return section;
      });
    });
    setDraggedLineInfo(null);
    playAudioFeedbackRef.current?.('drop');
  }, [draggedLineInfo, setDragOverLineInfo, setDraggedLineInfo, updateSong, playAudioFeedbackRef]);

  return {
    handleDrop,
    handleLineDragStart,
    handleLineDrop,
  };
};

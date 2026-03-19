import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';
import type { Section } from '../types';
import { cleanSectionName } from '../utils/songUtils';
import { generateId } from '../utils/idUtils';
import { createSongExport, type ExportFormat } from '../utils/exportUtils';
import { extractTextFromDocx, extractTextFromOdt } from '../utils/libraryUtils';
import {
  getSectionTypeKey,
  isAnchoredEndSection,
  isAnchoredStartSection,
  isLinkedChorusSectionName,
  isLinkedPreChorusPair,
  isPreChorusSectionName,
  isSectionType,
  isUniqueSectionType,
  shouldAutoNumberSection,
} from '../constants/sections';

type SaveFilePickerOptions = {
  suggestedName: string;
  startIn?: 'downloads';
  types?: Array<{ description: string; accept: Record<string, string[]> }>;
};

type SaveFilePickerHandle = {
  createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
};

type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<SaveFilePickerHandle>;
};

type LineDragInfo = { sectionId: string; lineId: string } | null;

type UseSongEditorParams = {
  song: Section[];
  structure: string[];
  newSectionName: string;
  setNewSectionName: Dispatch<SetStateAction<string>>;
  draggedItemIndex: number | null;
  setDraggedItemIndex: Dispatch<SetStateAction<number | null>>;
  setDragOverIndex: Dispatch<SetStateAction<number | null>>;
  draggedLineInfo: LineDragInfo;
  setDraggedLineInfo: Dispatch<SetStateAction<LineDragInfo>>;
  setDragOverLineInfo: Dispatch<SetStateAction<LineDragInfo>>;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateStructureWithHistory: (newStructure: string[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  title: string;
  topic: string;
  mood: string;
  openPasteModalWithText: (text: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
};

const makeEmptyLines = () =>
  Array(4).fill(null).map(() => ({
    id: generateId(),
    text: '',
    rhymingSyllables: '',
    rhyme: '',
    syllables: 0,
    concept: 'New line',
  }));

const makeEmptySection = (name: string): Section => ({
  id: generateId(),
  name,
  rhymeScheme: '',
  lines: makeEmptyLines(),
});

const getTiedSectionRange = (items: string[], index: number) => {
  if (index < 0 || index >= items.length) return { start: index, end: index };
  const current = items[index] ?? '';
  if (index + 1 < items.length && isLinkedPreChorusPair(current, items[index + 1])) {
    return { start: index, end: index + 1 };
  }
  if (isLinkedChorusSectionName(current) && index > 0 && isPreChorusSectionName(items[index - 1] ?? '')) {
    return { start: index - 1, end: index };
  }
  return { start: index, end: index };
};

export const useSongEditor = ({
  song,
  structure,
  newSectionName,
  setNewSectionName,
  draggedItemIndex,
  setDraggedItemIndex,
  setDragOverIndex,
  draggedLineInfo,
  setDraggedLineInfo,
  setDragOverLineInfo,
  updateState,
  updateStructureWithHistory,
  updateSongAndStructureWithHistory,
  title,
  topic,
  mood,
  openPasteModalWithText,
  playAudioFeedback,
}: UseSongEditorParams) => {
  const updateSong = useCallback((transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({
      song: transform(current.song),
      structure: current.structure,
    }));
  }, [updateState]);

  const removeStructureItem = useCallback((index: number) => {
    const newStructure = structure.filter((_, i) => i !== index);
    if (song.length > index) {
      const newSong = song.filter((_, i) => i !== index);
      updateSongAndStructureWithHistory(newSong, newStructure);
    } else {
      updateStructureWithHistory(newStructure);
    }
  }, [song, structure, updateSongAndStructureWithHistory, updateStructureWithHistory]);

  const addStructureItem = useCallback((name?: string) => {
    const itemToAdd = cleanSectionName(name || newSectionName.trim());
    if (!itemToAdd) return;

    const itemTypeKey = getSectionTypeKey(itemToAdd);
    if (isUniqueSectionType(itemToAdd)) {
      if (structure.some(s => getSectionTypeKey(s) === itemTypeKey)) return;
    }

    let finalName = itemToAdd;
    if (shouldAutoNumberSection(itemToAdd)) {
      const count = structure.filter(s => getSectionTypeKey(s) === itemTypeKey).length;
      if (itemToAdd === 'Verse' || count > 0) finalName = `${itemToAdd} ${count + 1}`;
    }

    let insertIndex = structure.length;
    if (isAnchoredStartSection(itemToAdd)) {
      insertIndex = 0;
    } else if (isSectionType(itemToAdd, 'pre-chorus')) {
      const nextChorusIndex = structure.findIndex(s => isSectionType(s, 'chorus'));
      if (nextChorusIndex !== -1) insertIndex = nextChorusIndex;
    } else if (isSectionType(itemToAdd, 'chorus')) {
      const lastPreChorusIndex = [...structure].reverse().findIndex(s => isSectionType(s, 'pre-chorus'));
      const lastVerseIndex = [...structure].reverse().findIndex(s => isSectionType(s, 'verse'));
      if (lastPreChorusIndex !== -1) insertIndex = structure.length - 1 - lastPreChorusIndex + 1;
      else if (lastVerseIndex !== -1) insertIndex = structure.length - 1 - lastVerseIndex + 1;
    }

    const anchoredEndIndex = structure.findIndex(isAnchoredEndSection);
    if (anchoredEndIndex !== -1 && insertIndex > anchoredEndIndex && !isAnchoredEndSection(itemToAdd)) insertIndex = anchoredEndIndex;

    const newStructure = [...structure];
    const newSong = [...song];
    newStructure.splice(insertIndex, 0, finalName);
    newSong.splice(insertIndex, 0, makeEmptySection(finalName));
    updateSongAndStructureWithHistory(newSong, newStructure);
    if (!name) setNewSectionName('');
  }, [song, structure, newSectionName, setNewSectionName, updateSongAndStructureWithHistory]);

  const normalizeStructure = useCallback(() => {
    const intros = structure.filter(isAnchoredStartSection);
    const verses = structure.filter(s => isSectionType(s, 'verse'));
    const preChoruses = structure.filter(s => isSectionType(s, 'pre-chorus'));
    const choruses = structure.filter(s => ['chorus', 'refrain', 'final-chorus'].includes(getSectionTypeKey(s) ?? ''));
    const bridges = structure.filter(s => ['bridge', 'middle-8'].includes(getSectionTypeKey(s) ?? ''));
    const outros = structure.filter(isAnchoredEndSection);
    const others = structure.filter(s => {
      const key = getSectionTypeKey(s);
      return !isAnchoredStartSection(s)
        && key !== 'verse'
        && key !== 'pre-chorus'
        && key !== 'chorus'
        && key !== 'refrain'
        && key !== 'final-chorus'
        && key !== 'bridge'
        && key !== 'middle-8'
        && !isAnchoredEndSection(s);
    });

    const newStructure: string[] = [];
    newStructure.push(...intros);
    const hasPreChorus = preChoruses.length > 0;
    let preChorusCount = 0;
    const maxVPC = Math.max(verses.length, choruses.length);
    for (let i = 0; i < maxVPC; i++) {
      if (i < verses.length) newStructure.push(verses[i]!);
      if (i < choruses.length) {
        if (hasPreChorus) {
          const existingPreChorus = preChoruses[preChorusCount];
          newStructure.push(existingPreChorus ?? `Pre-Chorus ${preChorusCount + 1}`);
          preChorusCount++;
        }
        newStructure.push(choruses[i]!);
      }
    }
    newStructure.push(...bridges, ...others, ...outros);

    let newSong: Section[] = [];
    if (song.length > 0) {
      const songCopy = [...song];
      newStructure.forEach(structName => {
        const index = songCopy.findIndex(s => s.name === structName);
        if (index !== -1) {
          newSong.push(songCopy[index]!);
          songCopy.splice(index, 1);
        } else {
          newSong.push(makeEmptySection(structName));
        }
      });
    }
    updateSongAndStructureWithHistory(newSong, newStructure);
  }, [song, structure, updateSongAndStructureWithHistory]);

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
    playAudioFeedback('drag');
  }, [setDraggedLineInfo, playAudioFeedback]);

  /**
   * fix #3: fully immutable line-drag implementation.
   * Previous version called splice() on spread arrays that still shared
   * the same line object references, causing React to miss state deltas
   * in strict/concurrent mode.
   * Now: filter (remove) + slice/concat (insert) — zero mutation.
   */
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
      if (sourceLineIndex === -1 || targetLineIndex === -1) return currentSong;

      const draggedLine = sourceSection.lines[sourceLineIndex]!;

      // Immutable: remove from source
      const newSourceLines = sourceSection.lines.filter((_, i) => i !== sourceLineIndex);

      // Immutable: insert into target
      // If cross-section: target lines still have the dragged line, insert at targetLineIndex
      // If same section: target lines already lack the dragged line (removed above), adjust index
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
    playAudioFeedback('drop');
  }, [draggedLineInfo, setDragOverLineInfo, setDraggedLineInfo, updateSong, playAudioFeedback]);

  const exportSong = useCallback(async (format: ExportFormat) => {
    if (song.length === 0) return;
    const { blob, filename } = createSongExport({ song, title, topic, mood, format });
    const saveWithPicker = async () => {
      const filePicker = (window as WindowWithSaveFilePicker).showSaveFilePicker;
      if (!filePicker) return false;
      try {
        const extension = filename.split('.').pop() ?? format;
        const handle = await filePicker({
          suggestedName: filename,
          startIn: 'downloads',
          types: [{ description: `${extension.toUpperCase()} file`, accept: { [blob.type || 'application/octet-stream']: [`.${extension}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return true;
        return false;
      }
    };
    const saved = await saveWithPicker();
    if (saved) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [song, title, topic, mood]);

  const loadFileForAnalysis = useCallback(async (file: File) => {
    let text = '';
    if (file.name.endsWith('.docx')) {
      text = await extractTextFromDocx(file);
    } else if (file.name.endsWith('.odt')) {
      text = await extractTextFromOdt(file);
    } else {
      text = await file.text();
    }
    if (text) openPasteModalWithText(text);
  }, [openPasteModalWithText]);

  return {
    removeStructureItem,
    addStructureItem,
    normalizeStructure,
    handleDrop,
    handleLineDragStart,
    handleLineDrop,
    exportSong,
    loadFileForAnalysis,
  };
};

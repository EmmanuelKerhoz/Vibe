import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type { Section } from '../types';
import { isAnchoredEndSection, isAnchoredStartSection } from '../constants/sections';
import { useDragHandlers } from './useDragHandlers';
import { useSectionManager } from './useSectionManager';
import { createSongExport, type ExportFormat } from '../utils/exportUtils';
import { extractImportPayloadFromDocx, extractImportPayloadFromOdt, extractImportPayloadFromText } from '../utils/libraryUtils';

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

type UseSongEditorParams = {
  song: Section[];
  structure: string[];
  newSectionName: string;
  setNewSectionName: Dispatch<SetStateAction<string>>;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateStructureWithHistory: (newStructure: string[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  title: string;
  topic: string;
  mood: string;
  songLanguage: string;
  openPasteModalWithText: (text: string) => void;
  playAudioFeedback: (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => void;
};

export const useSongEditor = ({
  song,
  structure,
  newSectionName,
  setNewSectionName,
  updateState,
  updateStructureWithHistory,
  updateSongAndStructureWithHistory,
  title,
  topic,
  mood,
  songLanguage,
  openPasteModalWithText,
  playAudioFeedback,
}: UseSongEditorParams) => {
  const { removeStructureItem, addStructureItem, normalizeStructure } = useSectionManager({
    song,
    structure,
    newSectionName,
    setNewSectionName,
    updateState,
    updateStructureWithHistory,
    updateSongAndStructureWithHistory,
  });
  const { handleDrop, handleLineDragStart, handleLineDrop } = useDragHandlers({
    song,
    structure,
    updateState,
    updateSongAndStructureWithHistory,
    playAudioFeedback,
  });

  // ── File operations ────────────────────────────────────────────────────────
  const exportSong = useCallback(async (format: ExportFormat) => {
    if (song.length === 0) return;
    const { blob, filename } = createSongExport({ song, title, topic, mood, songLanguage, format });
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
  }, [song, title, topic, mood, songLanguage]);

  const loadFileForAnalysis = useCallback(async (file: File) => {
    let payload = { text: '', songLanguage: '' };
    if (file.name.endsWith('.docx')) {
      payload = await extractImportPayloadFromDocx(file);
    } else if (file.name.endsWith('.odt')) {
      payload = await extractImportPayloadFromOdt(file);
    } else {
      payload = extractImportPayloadFromText(await file.text());
    }
    if (payload.text) openPasteModalWithText(payload.text);
    return payload;
  }, [openPasteModalWithText]);

  const introOutroSortedRef = useRef<string | null>(null);
  useEffect(() => {
    if (song.length === 0) return;
    const introIdx = song.findIndex(s => isAnchoredStartSection(s.name));
    const outroIdx = song.findIndex(s => isAnchoredEndSection(s.name));
    if (introIdx <= 0 && (outroIdx === -1 || outroIdx === song.length - 1)) return;
    const others = song.filter(s => !isAnchoredStartSection(s.name) && !isAnchoredEndSection(s.name));
    const sorted = [...(introIdx !== -1 ? [song[introIdx]!] : []), ...others, ...(outroIdx !== -1 ? [song[outroIdx]!] : [])];
    const key = JSON.stringify(sorted.map(s => s.id));
    if (key === introOutroSortedRef.current) return;
    introOutroSortedRef.current = key;
    updateSongAndStructureWithHistory(sorted, sorted.map(s => s.name));
  }, [song, updateSongAndStructureWithHistory]);

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

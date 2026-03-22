import { useCallback } from 'react';
import type { Section } from '../types';
import { createSongExport, type ExportFormat } from '../utils/exportUtils';
import { extractImportPayloadFromDocx, extractImportPayloadFromOdt, extractImportPayloadFromText } from '../utils/libraryUtils';

export type SaveFilePickerOptions = {
  suggestedName: string;
  startIn?: 'downloads';
  types?: Array<{ description: string; accept: Record<string, string[]> }>;
};

export type SaveFilePickerHandle = {
  createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
};

export type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<SaveFilePickerHandle>;
};

type UseFileOperationsParams = {
  song: Section[];
  title: string;
  topic: string;
  mood: string;
  songLanguage: string;
  openPasteModalWithText: (text: string) => void;
};

export const useFileOperations = ({
  song,
  title,
  topic,
  mood,
  songLanguage,
  openPasteModalWithText,
}: UseFileOperationsParams) => {
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

  return {
    exportSong,
    loadFileForAnalysis,
  };
};

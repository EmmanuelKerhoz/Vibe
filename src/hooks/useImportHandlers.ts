import { useCallback } from 'react';
import type { ChangeEvent, RefObject } from 'react';

type FilePickerHandle = { getFile: () => Promise<File> };
type WindowWithOpenFilePicker = Window & {
  showOpenFilePicker?: (options: object) => Promise<FilePickerHandle[]>;
};

type UseImportHandlersParams = {
  importInputRef: RefObject<HTMLInputElement | null>;
  loadFileForAnalysis: (file: File) => Promise<{ songLanguage?: string }>;
  setIsPasteModalOpen: (v: boolean) => void;
  setPastedText: (v: string) => void;
  setSongLanguage: (v: string) => void;
};

export const useImportHandlers = (params: UseImportHandlersParams) => {
  const { importInputRef, loadFileForAnalysis, setSongLanguage } = params;

  const restoreImportedSongLanguage = useCallback((payload: { songLanguage?: string }) => {
    const importedLanguage = payload.songLanguage?.trim() ?? '';
    if (importedLanguage) setSongLanguage(importedLanguage);
  }, [setSongLanguage]);

  const handleImportInputChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const payload = await loadFileForAnalysis(file);
    restoreImportedSongLanguage(payload);
  }, [loadFileForAnalysis, restoreImportedSongLanguage]);

  const handleImportChooseFile = useCallback(async () => {
    const pickerWindow = window as WindowWithOpenFilePicker;
    if (pickerWindow.showOpenFilePicker) {
      try {
        const [handle] = await pickerWindow.showOpenFilePicker({
          multiple: false,
          types: [{ description: 'Lyrics files', accept: {
            'text/plain': ['.txt', '.md'], 'text/markdown': ['.md'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.oasis.opendocument.text': ['.odt'],
          } }],
        });
        if (!handle) return;
        const file = await handle.getFile();
        const payload = await loadFileForAnalysis(file);
        restoreImportedSongLanguage(payload);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Failed to open import file picker', error);
        }
      }
      return;
    }
    importInputRef.current?.click();
  }, [importInputRef, loadFileForAnalysis, restoreImportedSongLanguage]);

  return { handleImportInputChange, handleImportChooseFile };
};

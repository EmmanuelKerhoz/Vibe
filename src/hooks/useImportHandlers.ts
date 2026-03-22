import { useCallback } from 'react';
import type { ChangeEvent, RefObject } from 'react';

type FilePickerHandle = { getFile: () => Promise<File> };
type WindowWithOpenFilePicker = Window & {
  showOpenFilePicker?: (options: object) => Promise<FilePickerHandle[]>;
};

type UseImportHandlersParams = {
  importInputRef: RefObject<HTMLInputElement | null>;
  loadFileForAnalysis: (file: File) => void | Promise<void>;
  setIsImportModalOpen: (v: boolean) => void;
  setIsPasteModalOpen: (v: boolean) => void;
  setPastedText: (v: string) => void;
};

export const useImportHandlers = (params: UseImportHandlersParams) => {
  const { importInputRef, loadFileForAnalysis, setIsImportModalOpen } = params;

  const handleImportInputChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsImportModalOpen(false);
    await loadFileForAnalysis(file);
  }, [loadFileForAnalysis, setIsImportModalOpen]);

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
        setIsImportModalOpen(false);
        await loadFileForAnalysis(file);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Failed to open import file picker', error);
        }
      }
      return;
    }
    importInputRef.current?.click();
  }, [importInputRef, loadFileForAnalysis, setIsImportModalOpen]);

  return { handleImportInputChange, handleImportChooseFile };
};

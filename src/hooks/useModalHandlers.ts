import { useCallback } from 'react';

interface UseModalHandlersParams {
  setIsPasteModalOpen: (v: boolean) => void;
  setIsImportModalOpen: (v: boolean) => void;
  setIsExportModalOpen: (v: boolean) => void;
  setIsSettingsOpen: (v: boolean) => void;
  setIsAboutOpen: (v: boolean) => void;
  setIsKeyboardShortcutsModalOpen: (v: boolean) => void;
  setSectionTargetLanguages: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
}

export function useModalHandlers({
  setIsPasteModalOpen,
  setIsImportModalOpen,
  setIsExportModalOpen,
  setIsSettingsOpen,
  setIsAboutOpen,
  setIsKeyboardShortcutsModalOpen,
  setSectionTargetLanguages,
}: UseModalHandlersParams) {
  const handleOpenPasteModal = useCallback(
    () => setIsPasteModalOpen(true),
    [setIsPasteModalOpen]
  );

  const handleOpenPasteLyricsFromModals = useCallback(() => {
    setIsImportModalOpen(false);
    setIsPasteModalOpen(true);
  }, [setIsImportModalOpen, setIsPasteModalOpen]);

  const handleOpenImport = useCallback(
    () => setIsImportModalOpen(true),
    [setIsImportModalOpen]
  );

  const handleOpenExport = useCallback(
    () => setIsExportModalOpen(true),
    [setIsExportModalOpen]
  );

  const handleOpenSettings = useCallback(
    () => setIsSettingsOpen(true),
    [setIsSettingsOpen]
  );

  const handleOpenAbout = useCallback(
    () => setIsAboutOpen(true),
    [setIsAboutOpen]
  );

  const handleOpenKeyboardShortcuts = useCallback(
    () => setIsKeyboardShortcutsModalOpen(true),
    [setIsKeyboardShortcutsModalOpen]
  );

  const handleSectionTargetLanguageChange = useCallback(
    (sectionId: string, lang: string) =>
      setSectionTargetLanguages(prev => ({ ...prev, [sectionId]: lang })),
    [setSectionTargetLanguages]
  );

  return {
    handleOpenPasteModal,
    handleOpenPasteLyricsFromModals,
    handleOpenImport,
    handleOpenExport,
    handleOpenSettings,
    handleOpenAbout,
    handleOpenKeyboardShortcuts,
    handleSectionTargetLanguageChange,
  };
}

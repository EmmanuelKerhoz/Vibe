import { useCallback } from 'react';
import type { AdaptationLangId } from '../i18n/constants';

interface UseModalHandlersParams {
  setIsPasteModalOpen: (v: boolean) => void;
  setIsExportModalOpen: (v: boolean) => void;
  setIsSettingsOpen: (v: boolean) => void;
  setIsAboutOpen: (v: boolean) => void;
  setIsKeyboardShortcutsModalOpen: (v: boolean) => void;
  setIsSearchReplaceOpen: (v: boolean) => void;
  setSectionTargetLanguages: (fn: (prev: Record<string, AdaptationLangId>) => Record<string, AdaptationLangId>) => void;
}

export function useModalHandlers({
  setIsPasteModalOpen,
  setIsExportModalOpen,
  setIsSettingsOpen,
  setIsAboutOpen,
  setIsKeyboardShortcutsModalOpen,
  setIsSearchReplaceOpen,
  setSectionTargetLanguages,
}: UseModalHandlersParams) {
  const handleOpenPasteModal = useCallback(
    () => setIsPasteModalOpen(true),
    [setIsPasteModalOpen]
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

  const handleOpenSearch = useCallback(
    () => setIsSearchReplaceOpen(true),
    [setIsSearchReplaceOpen]
  );

  const handleSectionTargetLanguageChange = useCallback(
    (sectionId: string, lang: AdaptationLangId) =>
      setSectionTargetLanguages(prev => ({ ...prev, [sectionId]: lang })),
    [setSectionTargetLanguages]
  );

  return {
    handleOpenPasteModal,
    handleOpenExport,
    handleOpenSettings,
    handleOpenAbout,
    handleOpenKeyboardShortcuts,
    handleOpenSearch,
    handleSectionTargetLanguageChange,
  };
}

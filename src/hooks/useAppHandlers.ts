import { useCallback } from 'react';
import type { Section } from '../types';

interface UseAppHandlersParams {
  t: {
    tooltips: {
      aiUnavailableHelp: string;
    };
  };
  hasRealLyricContent: boolean;
  song: Section[];
  isMobileOrTablet: boolean;
  setApiErrorModal: (modal: { open: boolean; message: string }) => void;
  setTitle: (title: string) => void;
  setTitleOrigin: (origin: 'user' | 'ai') => void;
  setConfirmModal: (modal: { open: boolean; onConfirm: () => void } | null) => void;
  setActiveTab: (tab: 'lyrics' | 'musical') => void;
  setIsLeftPanelOpen: (open: boolean) => void;
  setIsStructureOpen: (open: boolean) => void;
  generateTitle: () => Promise<string | null>;
  generateSong: () => Promise<void>;
  scrollToSection: (section: Section) => void;
}

export function useAppHandlers({
  t,
  hasRealLyricContent,
  song,
  isMobileOrTablet,
  setApiErrorModal,
  setTitle,
  setTitleOrigin,
  setConfirmModal,
  setActiveTab,
  setIsLeftPanelOpen,
  setIsStructureOpen,
  generateTitle,
  generateSong,
  scrollToSection,
}: UseAppHandlersParams) {
  const handleApiKeyHelp = useCallback(() => {
    setApiErrorModal({ open: true, message: t.tooltips.aiUnavailableHelp });
  }, [setApiErrorModal, t.tooltips.aiUnavailableHelp]);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    setTitleOrigin('user');
  }, [setTitle, setTitleOrigin]);

  const handleGenerateTitle = useCallback(async () => {
    const generatedTitle = await generateTitle();
    if (generatedTitle) {
      setTitle(generatedTitle);
      setTitleOrigin('ai');
    }
  }, [generateTitle, setTitle, setTitleOrigin]);

  const handleGlobalRegenerate = useCallback(() => {
    if (hasRealLyricContent) {
      setConfirmModal({
        open: true,
        onConfirm: () => {
          setConfirmModal(null);
          void generateSong();
        }
      });
    } else {
      void generateSong();
    }
  }, [hasRealLyricContent, setConfirmModal, generateSong]);

  const handleScrollToSection = useCallback((sectionId: string) => {
    const sec = song.find((s: Section) => s.id === sectionId);
    if (sec) scrollToSection(sec);
  }, [song, scrollToSection]);

  const handleOpenNewGeneration = useCallback(() => {
    setActiveTab('lyrics');
    setIsLeftPanelOpen(true);
    if (isMobileOrTablet) setIsStructureOpen(false);
  }, [isMobileOrTablet, setActiveTab, setIsLeftPanelOpen, setIsStructureOpen]);

  return {
    handleApiKeyHelp,
    handleTitleChange,
    handleGenerateTitle,
    handleGlobalRegenerate,
    handleScrollToSection,
    handleOpenNewGeneration,
  };
}

import { useState, useRef, useEffect } from 'react';

/** Splash guard — runs synchronously once to avoid double render. */
const SPLASH_SHOWN_KEY = 'vibe_splash_shown';
const shouldShowSplash = (): boolean => {
  try {
    if (localStorage.getItem(SPLASH_SHOWN_KEY)) return false;
    localStorage.setItem(SPLASH_SHOWN_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

export function useUIState() {
  // ── Modals ────────────────────────────────────────────────────────────────
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(() => shouldShowSplash());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiErrorModal, setApiErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const [isSimilarityModalOpen, setIsSimilarityModalOpen] = useState(false);
  const [isSaveToLibraryModalOpen, setIsSaveToLibraryModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isKeyboardShortcutsModalOpen, setIsKeyboardShortcutsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; onConfirm: () => void } | null>(null);
  const [promptModal, setPromptModal] = useState<{ open: boolean; onConfirm: (value: string) => void } | null>(null);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'lyrics' | 'musical'>('lyrics');
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);

  // ── Markup editor ─────────────────────────────────────────────────────────
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [markupText, setMarkupText] = useState('');
  const markupTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Import ref ────────────────────────────────────────────────────────────
  const importInputRef = useRef<HTMLInputElement>(null);

  // ── vibe:apierror global event ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      setApiErrorModal({ open: true, message: detail.message });
    };
    window.addEventListener('vibe:apierror', handler);
    return () => window.removeEventListener('vibe:apierror', handler);
  }, []);

  return {
    isAboutOpen, setIsAboutOpen,
    isSettingsOpen, setIsSettingsOpen,
    apiErrorModal, setApiErrorModal,
    isImportModalOpen, setIsImportModalOpen,
    isExportModalOpen, setIsExportModalOpen,
    isSectionDropdownOpen, setIsSectionDropdownOpen,
    isSimilarityModalOpen, setIsSimilarityModalOpen,
    isSaveToLibraryModalOpen, setIsSaveToLibraryModalOpen,
    isVersionsModalOpen, setIsVersionsModalOpen,
    isResetModalOpen, setIsResetModalOpen,
    isKeyboardShortcutsModalOpen, setIsKeyboardShortcutsModalOpen,
    confirmModal, setConfirmModal,
    promptModal, setPromptModal,
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    isMarkupMode, setIsMarkupMode,
    markupText, setMarkupText,
    markupTextareaRef,
    importInputRef,
  };
}

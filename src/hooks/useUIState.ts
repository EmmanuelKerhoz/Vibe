import { useState, useRef, useEffect } from 'react';
import type { EditMode } from '../types';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

/** Splash guard — runs synchronously once to avoid double render. */
const SPLASH_SHOWN_KEY = 'vibe_splash_shown';
const shouldShowSplash = (): boolean => {
  try {
    if (safeGetItem(SPLASH_SHOWN_KEY)) return false;
    safeSetItem(SPLASH_SHOWN_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

// Internal base — consumed only via useAppState. Do not merge or delete without confirming the full dependency chain.
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
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSearchReplaceOpen, setIsSearchReplaceOpen] = useState(false);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'lyrics' | 'musical'>('lyrics');
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);

  // ── Edit mode ────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState<EditMode>('markdown');
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
    isPasteModalOpen, setIsPasteModalOpen,
    isAnalysisModalOpen, setIsAnalysisModalOpen,
    isSearchReplaceOpen, setIsSearchReplaceOpen,
    activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen,
    isLeftPanelOpen, setIsLeftPanelOpen,
    editMode, setEditMode,
    markupText, setMarkupText,
    markupTextareaRef,
    importInputRef,
  };
}

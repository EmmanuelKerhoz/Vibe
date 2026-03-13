import { useState, useEffect, useRef } from 'react';
import { SimilarityMatch } from '../utils/similarityUtils';
import { LibraryAsset } from '../utils/libraryUtils';
import { DEFAULT_TITLE, DEFAULT_TOPIC, DEFAULT_MOOD } from '../utils/songDefaults';

/** Key used to track first-ever launch (splash shown once). */
const SPLASH_SHOWN_KEY = 'vibe_splash_shown';

/** Read splash guard synchronously so the initial state is correct before any render. */
const shouldShowSplash = (): boolean => {
  try {
    if (localStorage.getItem(SPLASH_SHOWN_KEY)) return false;
    localStorage.setItem(SPLASH_SHOWN_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

export function useAppState() {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [titleOrigin, setTitleOrigin] = useState<'user' | 'ai'>('user');
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [mood, setMood] = useState(DEFAULT_MOOD);
  const [rhymeScheme, setRhymeScheme] = useState('AABB');
  const [targetSyllables, setTargetSyllables] = useState(10);
  const [newSectionName, setNewSectionName] = useState('');
  const [genre, setGenre] = useState('');
  const [tempo, setTempo] = useState('120');
  const [instrumentation, setInstrumentation] = useState('');
  const [rhythm, setRhythm] = useState('');
  const [narrative, setNarrative] = useState('');
  const [musicalPrompt, setMusicalPrompt] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<'lyrics' | 'musical'>('lyrics');
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggableSectionIndex, setDraggableSectionIndex] = useState<number | null>(null);
  const [draggedLineInfo, setDraggedLineInfo] = useState<{ sectionId: string; lineId: string } | null>(null);
  const [dragOverLineInfo, setDragOverLineInfo] = useState<{ sectionId: string; lineId: string } | null>(null);
  const [similarityMatches, setSimilarityMatches] = useState<SimilarityMatch[]>([]);
  const [libraryCount, setLibraryCount] = useState(0);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [markupText, setMarkupText] = useState('');

  // Splash shown exactly once — initialised synchronously to avoid double render
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
  const [shouldAutoGenerateTitle, setShouldAutoGenerateTitle] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; onConfirm: () => void } | null>(null);
  const [promptModal, setPromptModal] = useState<{ open: boolean; onConfirm: (value: string) => void } | null>(null);
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  const sectionDropdownRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const markupTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Theme class on <html>
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then((data: { available?: boolean }) => setHasApiKey(data.available === true))
      .catch(() => setHasApiKey(false));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      setApiErrorModal({ open: true, message: detail.message });
    };
    window.addEventListener('vibe:apierror', handler);
    return () => window.removeEventListener('vibe:apierror', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    title, setTitle, titleOrigin, setTitleOrigin,
    topic, setTopic, mood, setMood,
    rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables,
    newSectionName, setNewSectionName,
    genre, setGenre, tempo, setTempo,
    instrumentation, setInstrumentation, rhythm, setRhythm,
    narrative, setNarrative, musicalPrompt, setMusicalPrompt,
    theme, setTheme, activeTab, setActiveTab,
    isStructureOpen, setIsStructureOpen, isLeftPanelOpen, setIsLeftPanelOpen,
    draggedItemIndex, setDraggedItemIndex, dragOverIndex, setDragOverIndex,
    draggableSectionIndex, setDraggableSectionIndex,
    draggedLineInfo, setDraggedLineInfo, dragOverLineInfo, setDragOverLineInfo,
    similarityMatches, setSimilarityMatches, libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets, isSavingToLibrary, setIsSavingToLibrary,
    audioFeedback, setAudioFeedback,
    isMarkupMode, setIsMarkupMode, markupText, setMarkupText,
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
    shouldAutoGenerateTitle, setShouldAutoGenerateTitle,
    confirmModal, setConfirmModal, promptModal, setPromptModal,
    hasSavedSession, setHasSavedSession,
    isSessionHydrated, setIsSessionHydrated,
    hasApiKey,
    sectionDropdownRef, importInputRef, markupTextareaRef,
  };
}

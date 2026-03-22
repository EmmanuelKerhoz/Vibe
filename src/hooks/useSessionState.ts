import { useState, useEffect } from 'react';
import { SimilarityMatch } from '../utils/similarityUtils';
import { LibraryAsset } from '../utils/libraryUtils';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

const UI_SCALE_KEY = 'vibe_ui_scale';
const DEFAULT_EDIT_MODE_KEY = 'vibe_default_edit_mode';

export function useSessionState() {
  // ── Theme ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // ── API / session ─────────────────────────────────────────────────────────
  // P2-fix: init false — set to true only after server confirmation
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const [audioFeedback, setAudioFeedback] = useState(true);

  // ── UI Scale ──────────────────────────────────────────────────────────────
  const [uiScale, setUiScaleRaw] = useState<'small' | 'medium' | 'large'>(() => {
    const stored = safeGetItem(UI_SCALE_KEY);
    if (stored === 'small' || stored === 'medium') return stored as 'small' | 'medium';
    return 'large';
  });

  const setUiScale = (v: 'small' | 'medium' | 'large') => {
    setUiScaleRaw(v);
    safeSetItem(UI_SCALE_KEY, v);
  };

  // ── Default Edit Mode ─────────────────────────────────────────────────────
  const [defaultEditMode, setDefaultEditModeRaw] = useState<'section' | 'markdown'>(() => {
    const stored = safeGetItem(DEFAULT_EDIT_MODE_KEY);
    return stored === 'markdown' ? 'markdown' : 'section';
  });

  const setDefaultEditMode = (v: 'section' | 'markdown') => {
    setDefaultEditModeRaw(v);
    safeSetItem(DEFAULT_EDIT_MODE_KEY, v);
  };

  // ── Library / similarity ──────────────────────────────────────────────────
  const [similarityMatches, setSimilarityMatches] = useState<SimilarityMatch[]>([]);
  const [libraryCount, setLibraryCount] = useState(0);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);

  // ── Theme class on <html> ─────────────────────────────────────────────────
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // ── UI Scale on <html> ────────────────────────────────────────────────────
  useEffect(() => {
    const sizes: Record<string, string> = { small: '12px', medium: '14px', large: '16px' };
    document.documentElement.style.fontSize = sizes[uiScale] ?? '16px';
  }, [uiScale]);

  // ── API key status check ──────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/status', { signal: controller.signal })
      .then(r => r.json())
      .then((data: { available?: boolean }) => setHasApiKey(data.available === true))
      .catch((err) => { if (err.name !== 'AbortError') setHasApiKey(false); });
    return () => controller.abort();
  }, []);

  return {
    theme, setTheme,
    hasApiKey,
    isSessionHydrated, setIsSessionHydrated,
    hasSavedSession, setHasSavedSession,
    audioFeedback, setAudioFeedback,
    uiScale, setUiScale,
    defaultEditMode, setDefaultEditMode,
    similarityMatches, setSimilarityMatches,
    libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets,
    isSavingToLibrary, setIsSavingToLibrary,
  };
}

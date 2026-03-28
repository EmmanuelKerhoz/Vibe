import { useState, useEffect, useCallback } from 'react';
import { SimilarityMatch } from '../utils/similarityUtils';
import { LibraryAsset } from '../utils/libraryUtils';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

const UI_SCALE_KEY = 'vibe_ui_scale';
const DEFAULT_EDIT_MODE_KEY = 'vibe_default_edit_mode';
const SHOW_TRANSLATION_KEY = 'vibe_show_translation';
const API_STATUS_RETRY_DELAYS_MS = [500, 1500];
const API_STATUS_TIMEOUT_MS = 5000;

const createAbortError = () => new DOMException('Aborted', 'AbortError');

const waitWithAbort = (delayMs: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) {
    reject(createAbortError());
    return;
  }

  const timeoutId = window.setTimeout(() => {
    signal.removeEventListener('abort', handleAbort);
    resolve();
  }, delayMs);

  const handleAbort = () => {
    window.clearTimeout(timeoutId);
    signal.removeEventListener('abort', handleAbort);
    reject(createAbortError());
  };

  signal.addEventListener('abort', handleAbort, { once: true });
});

const fetchApiStatusWithTimeout = async (signal: AbortSignal): Promise<{ available?: boolean }> => {
  const attemptController = new AbortController();
  const abortAttempt = () => attemptController.abort();
  let timeoutId: number | undefined;

  if (signal.aborted) {
    attemptController.abort();
    throw createAbortError();
  }

  signal.addEventListener('abort', abortAttempt, { once: true });

  try {
    return await Promise.race([
      fetch('/api/status', { signal: attemptController.signal })
        .then(r => r.json() as Promise<{ available?: boolean }>)
        .finally(() => {
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        }),
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          signal.removeEventListener('abort', abortAttempt);
          attemptController.abort();
          reject(new Error('API status request timed out'));
        }, API_STATUS_TIMEOUT_MS);

        attemptController.signal.addEventListener('abort', () => {
          window.clearTimeout(timeoutId);
        }, { once: true });
      }),
    ]);
  } finally {
    signal.removeEventListener('abort', abortAttempt);
  }
};

export function useSessionState() {
  // ── Theme ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // ── API / session ─────────────────────────────────────────────────────────
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

  // Memoized to avoid invalidating useCallback deps in consumers.
  const setUiScale = useCallback((v: 'small' | 'medium' | 'large') => {
    setUiScaleRaw(v);
    safeSetItem(UI_SCALE_KEY, v);
  }, []);

  // ── Default Edit Mode ─────────────────────────────────────────────────────
  const [defaultEditMode, setDefaultEditModeRaw] = useState<'text' | 'section' | 'markdown' | 'phonetic'>(() => {
    const stored = safeGetItem(DEFAULT_EDIT_MODE_KEY);
    if (stored === 'section' || stored === 'text' || stored === 'phonetic') return stored;
    return 'markdown';
  });

  // Memoized to avoid invalidating useCallback deps in consumers.
  const setDefaultEditMode = useCallback((v: 'text' | 'section' | 'markdown' | 'phonetic') => {
    setDefaultEditModeRaw(v);
    safeSetItem(DEFAULT_EDIT_MODE_KEY, v);
  }, []);

  // ── Show Translation Features ─────────────────────────────────────────────
  const [showTranslationFeatures, setShowTranslationFeaturesRaw] = useState<boolean>(() => {
    const stored = safeGetItem(SHOW_TRANSLATION_KEY);
    return stored === 'false' ? false : true;
  });

  // Memoized to avoid invalidating useCallback deps in consumers.
  const setShowTranslationFeatures = useCallback((v: boolean) => {
    setShowTranslationFeaturesRaw(v);
    safeSetItem(SHOW_TRANSLATION_KEY, String(v));
  }, []);

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

    const loadApiStatus = async () => {
      for (let attempt = 0; attempt <= API_STATUS_RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          const data = await fetchApiStatusWithTimeout(controller.signal);
          setHasApiKey(data.available === true);
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          if (attempt === API_STATUS_RETRY_DELAYS_MS.length) {
            setHasApiKey(false);
            return;
          }
          const retryDelayMs = API_STATUS_RETRY_DELAYS_MS[attempt];
          if (retryDelayMs === undefined) {
            setHasApiKey(false);
            return;
          }
          try {
            await waitWithAbort(retryDelayMs, controller.signal);
          } catch (waitError) {
            if (waitError instanceof DOMException && waitError.name === 'AbortError') return;
            throw waitError;
          }
        }
      }
    };

    void loadApiStatus();
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
    showTranslationFeatures, setShowTranslationFeatures,
    similarityMatches, setSimilarityMatches,
    libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets,
    isSavingToLibrary, setIsSavingToLibrary,
  };
}

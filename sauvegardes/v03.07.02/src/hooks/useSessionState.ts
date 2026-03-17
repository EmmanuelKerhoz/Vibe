import { useState, useEffect } from 'react';
import { SimilarityMatch } from '../utils/similarityUtils';
import { LibraryAsset } from '../utils/libraryUtils';

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

  // ── Drag state ────────────────────────────────────────────────────────────
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedLineInfo, setDraggedLineInfo] = useState<{ sectionId: string; lineId: string } | null>(null);
  const [dragOverLineInfo, setDragOverLineInfo] = useState<{ sectionId: string; lineId: string } | null>(null);

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
    draggedItemIndex, setDraggedItemIndex,
    dragOverIndex, setDragOverIndex,
    draggedLineInfo, setDraggedLineInfo,
    dragOverLineInfo, setDragOverLineInfo,
    similarityMatches, setSimilarityMatches,
    libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets,
    isSavingToLibrary, setIsSavingToLibrary,
  };
}

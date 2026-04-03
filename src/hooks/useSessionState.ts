/**
 * useSessionState
 *
 * Composition shell — assembles the 4 domain hooks into the same surface
 * that all existing consumers expect. No logic lives here.
 *
 * Domain hooks:
 *   useThemeState      — theme toggle + <html> class
 *   useApiStatus       — hasApiKey via /api/status with retry
 *   useUiPreferences   — uiScale, defaultEditMode, showTranslation + fontSize
 *   useLibraryState    — similarityMatches, libraryCount, libraryAssets, isSavingToLibrary
 *
 * Session (isSessionHydrated, hasSavedSession) and audio (audioFeedback)
 * remain here as lightweight glue state — they don't belong to any single domain.
 */
import { useState } from 'react';
import { useThemeState } from './useThemeState';
import { useApiStatus } from './useApiStatus';
import { useUiPreferences } from './useUiPreferences';
import { useLibraryState } from './useLibraryState';

export function useSessionState() {
  const { theme, setTheme } = useThemeState();
  const { hasApiKey } = useApiStatus();
  const {
    uiScale, setUiScale,
    defaultEditMode, setDefaultEditMode,
    showTranslationFeatures, setShowTranslationFeatures,
  } = useUiPreferences();
  const {
    similarityMatches, setSimilarityMatches,
    libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets,
    isSavingToLibrary, setIsSavingToLibrary,
  } = useLibraryState();

  // Glue state: session hydration
  const [isSessionHydrated, setIsSessionHydrated] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);

  // Glue state: audio feedback toggle
  const [audioFeedback, setAudioFeedback] = useState(true);

  return {
    // Theme
    theme, setTheme,
    // API
    hasApiKey,
    // Session
    isSessionHydrated, setIsSessionHydrated,
    hasSavedSession, setHasSavedSession,
    // Audio
    audioFeedback, setAudioFeedback,
    // UI Preferences
    uiScale, setUiScale,
    defaultEditMode, setDefaultEditMode,
    showTranslationFeatures, setShowTranslationFeatures,
    // Library
    similarityMatches, setSimilarityMatches,
    libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets,
    isSavingToLibrary, setIsSavingToLibrary,
  };
}

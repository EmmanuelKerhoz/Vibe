/**
 * useLibraryState
 *
 * Owns: similarityMatches, libraryCount, libraryAssets, isSavingToLibrary.
 * These are transient UI states — no persistence, no side-effects.
 * Extracted from useSessionState (Phase-2 domain-hook split).
 */
import { useState } from 'react';
import type { SimilarityMatch } from '../utils/similarityUtils';
import type { LibraryAsset } from '../utils/libraryUtils';

export function useLibraryState() {
  const [similarityMatches, setSimilarityMatches] = useState<SimilarityMatch[]>([]);
  const [libraryCount, setLibraryCount] = useState(0);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);

  return {
    similarityMatches, setSimilarityMatches,
    libraryCount, setLibraryCount,
    libraryAssets, setLibraryAssets,
    isSavingToLibrary, setIsSavingToLibrary,
  };
}

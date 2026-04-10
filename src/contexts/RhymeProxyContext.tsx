/**
 * RhymeProxyContext
 *
 * Provides a song-level `isProxied` map derived from `analyzeSongRhymes`.
 * Each entry indicates whether the phonological analysis for that section
 * fell back to the graphemic proxy layer (no native G2P strategy available
 * for the song language).
 *
 * Architecture:
 *  - Pure derived state: no mutation, no history, no undo.
 *  - Recomputes only when `song` sections or `songLanguage` changes.
 *  - Exposes a stable `isProxiedForSection(sectionId)` helper so consumers
 *    avoid Map.get() spread and get a safe boolean default.
 *  - Must be mounted inside <SongProvider> (needs useSongContext).
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useSongContext } from './SongContext';
import { analyzeSongRhymes } from '../lib/linguistics/rhyme/songRhymeAnalysis';

// ─── Types ────────────────────────────────────────────────────────────────

interface RhymeProxyContextValue {
  /** Map from sectionId → isProxied boolean. */
  proxyMap: Map<string, boolean>;
  /** Safe getter: returns false when sectionId is not in the map. */
  isProxiedForSection: (sectionId: string) => boolean;
}

const RhymeProxyContext = createContext<RhymeProxyContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export function RhymeProxyProvider({ children }: { children: ReactNode }) {
  const { song, songLanguage } = useSongContext();

  // analyzeSongRhymes is a pure synchronous function — safe in useMemo.
  // Re-runs only when song reference or songLanguage changes.
  const proxyMap = useMemo<Map<string, boolean>>(() => {
    if (!song || song.length === 0) return new Map();
    try {
      const results = analyzeSongRhymes(song, songLanguage ?? 'en', false);
      return new Map(results.map(r => [r.sectionId, r.isProxied]));
    } catch {
      return new Map();
    }
  }, [song, songLanguage]);

  const isProxiedForSection = useCallback(
    (sectionId: string) => proxyMap.get(sectionId) ?? false,
    [proxyMap],
  );

  const value = useMemo<RhymeProxyContextValue>(
    () => ({ proxyMap, isProxiedForSection }),
    [proxyMap, isProxiedForSection],
  );

  return (
    <RhymeProxyContext.Provider value={value}>
      {children}
    </RhymeProxyContext.Provider>
  );
}

// ─── Consumer hook ──────────────────────────────────────────────────────────

export function useRhymeProxyContext(): RhymeProxyContextValue {
  const ctx = useContext(RhymeProxyContext);
  if (!ctx) throw new Error('useRhymeProxyContext must be used inside <RhymeProxyProvider>');
  return ctx;
}

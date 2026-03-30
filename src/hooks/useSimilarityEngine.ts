/**
 * useSimilarityEngine
 * Background web similarity search — debounced, volatile (session-only).
 * Triggers automatically when lyrics change significantly.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WebSimilarityIndex } from '../types/webSimilarity';
import { DEFAULT_TITLE } from '../constants/editor';
import { runSearchTree } from '../utils/webSimilaritySearch';
import { useSongContext } from '../contexts/SongContext';

const DEBOUNCE_MS = 30_000;        // 30s after last keystroke
const DELTA_THRESHOLD = 0.20;     // retrigger if text changed by >20%

const textFingerprint = (title: string, sections: import('../types').Section[]): string =>
  [title.trim(), ...sections.flatMap(s => s.lines.map(l => l.text))].join('\n');

/**
 * Unicode-safe character delta: iterates over code points, not UTF-16 units.
 * FIX: length-ratio guard runs on raw string .length BEFORE spreading into char arrays.
 * This avoids O(n) allocation on every keystroke for large songs — spread only happens
 * when lengths are close enough that a character-level diff is actually needed.
 */
const changeDelta = (prev: string, next: string): number => {
  if (!prev) return 1;
  const prevLen = prev.length;
  const nextLen = next.length;
  const maxLen = Math.max(prevLen, nextLen);
  if (maxLen === 0) return 0;
  // Early-exit on length ratio BEFORE any spread allocation.
  const lengthRatioDelta = Math.abs(prevLen - nextLen) / maxLen;
  if (lengthRatioDelta > DELTA_THRESHOLD) return lengthRatioDelta;
  // Only spread into code-point arrays when lengths are similar enough
  // that a character-level comparison is warranted.
  const prevChars = [...prev];
  const nextChars = [...next];
  const charMaxLen = Math.max(prevChars.length, nextChars.length);
  let diff = 0;
  for (let i = 0; i < charMaxLen; i++) {
    if (prevChars[i] !== nextChars[i]) diff++;
  }
  return diff / charMaxLen;
};

const INITIAL_INDEX: WebSimilarityIndex = {
  candidates: [],
  status: 'idle',
  lastUpdated: null,
  error: null,
};

export const useSimilarityEngine = ({ hasApiKey = true }: { hasApiKey?: boolean } = {}) => {
  const { song: sections, title, songLanguage } = useSongContext();
  const [index, setIndex] = useState<WebSimilarityIndex>(INITIAL_INDEX);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastFingerprintRef = useRef<string>('');
  const effectiveTitle = title.trim() === DEFAULT_TITLE ? '' : title;

  const runSearch = useCallback(async (currentSections: import('../types').Section[], currentTitle: string, currentSongLanguage: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIndex(prev => ({ ...prev, status: 'running', error: null }));

    try {
      const candidates = await runSearchTree(currentSections, currentTitle, currentSongLanguage, controller.signal);
      if (controller.signal.aborted) return;
      setIndex({
        candidates,
        status: 'done',
        lastUpdated: Date.now(),
        error: null,
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      setIndex(prev => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Search failed',
      }));
    }
  }, []);

  /** Reset index to initial state — call on song reset / new empty draft */
  const resetIndex = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    lastFingerprintRef.current = '';
    setIndex(INITIAL_INDEX);
  }, []);

  const fingerprint = useMemo(
    () => textFingerprint(effectiveTitle, sections),
    [effectiveTitle, sections]
  );

  useEffect(() => {
    if (!hasApiKey) {
      abortRef.current?.abort();
      abortRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = null;
      return;
    }

    const delta = changeDelta(lastFingerprintRef.current, fingerprint);

    if (delta < DELTA_THRESHOLD && lastFingerprintRef.current !== '') return;

    const hasContent = effectiveTitle.trim().length > 0 || sections.some(s => s.lines.some(l => l.text.trim().length > 0));
    if (!hasContent) return;

    lastFingerprintRef.current = fingerprint;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(sections, effectiveTitle, songLanguage);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fingerprint, effectiveTitle, hasApiKey, sections, runSearch, songLanguage]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /** Force immediate search (e.g. on user demand) */
  const triggerNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(sections, effectiveTitle, songLanguage);
  }, [effectiveTitle, sections, runSearch, songLanguage]);

  return { index, triggerNow, resetIndex };
};

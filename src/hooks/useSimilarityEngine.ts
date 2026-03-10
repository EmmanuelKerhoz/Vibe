/**
 * useSimilarityEngine
 * Background web similarity search — debounced, volatile (session-only).
 * Triggers automatically when lyrics change significantly.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Section } from '../types';
import type { WebSimilarityIndex } from '../types/webSimilarity';
import { runSearchTree } from '../utils/webSimilaritySearch';

const DEBOUNCE_MS = 30_000;        // 30s after last keystroke
const DELTA_THRESHOLD = 0.20;     // retrigger if text changed by >20%

const textFingerprint = (sections: Section[]): string =>
  sections.flatMap(s => s.lines.map(l => l.text)).join('\n');

const changeDelta = (prev: string, next: string): number => {
  if (!prev) return 1;
  const maxLen = Math.max(prev.length, next.length);
  if (maxLen === 0) return 0;
  let diff = 0;
  for (let i = 0; i < maxLen; i++) {
    if (prev[i] !== next[i]) diff++;
  }
  return diff / maxLen;
};

const INITIAL_INDEX: WebSimilarityIndex = {
  candidates: [],
  status: 'idle',
  lastUpdated: null,
  error: null,
};

export const useSimilarityEngine = (sections: Section[]) => {
  const [index, setIndex] = useState<WebSimilarityIndex>(INITIAL_INDEX);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastFingerprintRef = useRef<string>('');

  const runSearch = useCallback(async (currentSections: Section[]) => {
    // Cancel any in-flight search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIndex(prev => ({ ...prev, status: 'running', error: null }));

    try {
      const candidates = await runSearchTree(currentSections, controller.signal);
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

  useEffect(() => {
    const fingerprint = textFingerprint(sections);
    const delta = changeDelta(lastFingerprintRef.current, fingerprint);

    // Skip if text hasn't changed enough
    if (delta < DELTA_THRESHOLD && lastFingerprintRef.current !== '') return;

    // Skip if sections are essentially empty
    const hasContent = sections.some(s => s.lines.some(l => l.text.trim().length > 0));
    if (!hasContent) return;

    lastFingerprintRef.current = fingerprint;

    // Debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(sections);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sections, runSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /** Force immediate search (e.g. on user demand) */
  const triggerNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(sections);
  }, [sections, runSearch]);

  return { index, triggerNow };
};

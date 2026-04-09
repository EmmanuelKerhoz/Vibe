/**
 * useLinguisticsWorker — React hook for off-thread phonological analysis.
 *
 * Manages a Web Worker lifecycle with:
 *   - Debounced dispatch (300ms) so keystrokes are never blocked
 *   - Request deduplication via monotonic request IDs
 *   - Clean teardown on unmount
 *
 * Architecture invariant: the resulting `analysisState` is pure derived data.
 * It MUST NOT be stored in the UNDO/REDO history stack.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Section } from '../types';
import { languageNameToCode } from '../constants/langFamilyMap';
import type {
  WorkerRequest,
  WorkerResponse,
  AnalysisResult,
  SectionInput,
} from '../lib/workers/linguistics.types';

export interface LinguisticsWorkerState {
  /** Latest analysis result from the worker. */
  result: AnalysisResult | null;
  /** Whether the worker is currently processing. */
  isComputing: boolean;
  /** Last error message from the worker. */
  error: string | null;
  /** Force a re-analysis now (bypass debounce). */
  analyzeNow: () => void;
}

const DEBOUNCE_MS = 300;

/**
 * djb2 hash — fast non-cryptographic string hash.
 * Pure arithmetic, no allocations, safe for fingerprinting lyric text.
 */
function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep as unsigned 32-bit
  }
  return h;
}

export function useLinguisticsWorker(
  song: Section[],
  songLanguage?: string,
): LinguisticsWorkerState {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRequestIdRef = useRef<string | null>(null);
  // Guard: prevents setState calls after component unmount (race condition
  // between worker response callback and cleanup termination).
  const unmountedRef = useRef(false);

  // Stable references for current song/language
  const songRef = useRef(song);
  songRef.current = song;
  const langRef = useRef(songLanguage);
  langRef.current = songLanguage;

  // ─── Worker lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    unmountedRef.current = false;

    // Guard: Worker API may not be available in test environments (jsdom).
    if (typeof Worker === 'undefined') return;

    const worker = new Worker(
      new URL('../lib/workers/linguistics.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (unmountedRef.current) return;
      const response = event.data;
      if (response.type === 'result') {
        // Only accept the latest request
        if (response.payload.requestId === pendingRequestIdRef.current) {
          setResult(response.payload);
          setIsComputing(false);
          setError(null);
        }
      } else if (response.type === 'error') {
        if (response.payload.requestId === pendingRequestIdRef.current) {
          setError(response.payload.message);
          setIsComputing(false);
        }
      }
    };

    worker.onerror = (event) => {
      if (unmountedRef.current) return;
      // event.message can be an empty string in Firefox sandboxed workers
      // (cross-origin isolation suppresses the error detail). Fall back to a
      // meaningful default so the UI always surfaces a non-empty error string.
      setError(event.message || 'Worker crashed unexpectedly');
      setIsComputing(false);
    };

    workerRef.current = worker;

    return () => {
      unmountedRef.current = true;
      worker.terminate();
      workerRef.current = null;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ─── Dispatch helper ───────────────────────────────────────────────────────

  const dispatch = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const currentSong = songRef.current;
    const currentLang = langRef.current;
    const langCode = languageNameToCode(currentLang ?? 'English') ?? 'en';

    // Build payload
    const sections: SectionInput[] = currentSong.map(s => ({
      sectionId: s.id,
      sectionName: s.name,
      lines: s.lines.map(l => ({
        lineId: l.id,
        text: l.text,
        isMeta: l.isMeta ?? false,
      })),
      ...(s.targetSchema !== undefined ? { targetSchema: s.targetSchema } : {}),
    }));

    requestIdRef.current += 1;
    const requestId = `req-${requestIdRef.current}`;
    pendingRequestIdRef.current = requestId;

    setIsComputing(true);
    setError(null);

    const message: WorkerRequest = {
      type: 'analyze',
      payload: { requestId, sections, langCode },
    };

    worker.postMessage(message);
  }, []);

  // ─── Song fingerprint — lightweight djb2 hash, no string encoding ──────────

  const songFingerprint = useMemo(() => {
    // Per-line: lineId (structurally unique) + text length + djb2(text).
    // djb2 is O(n) chars but purely arithmetic — no URI encoding overhead.
    return song
      .flatMap(s => s.lines)
      .map(l => `${l.id}:${l.text.length}:${djb2(l.text)}`)
      .join('|');
  }, [song]);

  // ─── Debounced analysis trigger ────────────────────────────────────────────

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(dispatch, DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [songFingerprint, songLanguage, dispatch]);

  const analyzeNow = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    dispatch();
  }, [dispatch]);

  return { result, isComputing, error, analyzeNow };
}

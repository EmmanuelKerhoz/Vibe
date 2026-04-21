/**
 * useSuno — React hook wrapping SunoService.
 *
 * Exposes:
 *   generate(params)  — trigger generation + auto-poll
 *   extend(id, at)    — extend a track
 *   status            — current task lifecycle state
 *   songs             — last resolved song list
 *   kpi               — live KPI snapshot (refreshed every 2s)
 *   reset()           — clear state
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateSong,
  extendSong,
  pollUntilDone,
  getKPISnapshot,
} from '../services/sunoService';
import type {
  SunoGenerateParams,
  SunoSong,
  SunoTaskStatus,
  SunoKPISnapshot,
} from '../types/suno';

export interface UseSunoReturn {
  generate: (params: SunoGenerateParams) => Promise<void>;
  extend: (songId: string, continueAt: number, prompt?: string) => Promise<void>;
  status: SunoTaskStatus;
  songs: SunoSong[];
  kpi: SunoKPISnapshot;
  reset: () => void;
}

export function useSuno(): UseSunoReturn {
  const [status, setStatus] = useState<SunoTaskStatus>({ phase: 'idle' });
  const [songs, setSongs] = useState<SunoSong[]>([]);
  const [kpi, setKpi] = useState<SunoKPISnapshot>(getKPISnapshot());
  const pollingStart = useRef<number>(0);

  // Refresh KPI every 2 s (cheap in-memory read)
  useEffect(() => {
    const id = setInterval(() => setKpi(getKPISnapshot()), 2000);
    return () => clearInterval(id);
  }, []);

  const generate = useCallback(async (params: SunoGenerateParams) => {
    setStatus({ phase: 'generating', ids: [] });
    try {
      const initial = await generateSong(params);
      const ids = initial.map((s) => s.id);
      pollingStart.current = Date.now();
      setStatus({ phase: 'polling', ids, elapsed: 0 });

      // Elapsed ticker
      const ticker = setInterval(() => {
        setStatus((prev) =>
          prev.phase === 'polling'
            ? { ...prev, elapsed: Date.now() - pollingStart.current }
            : prev,
        );
      }, 1000);

      const done = await pollUntilDone(ids);
      clearInterval(ticker);

      setSongs(done);
      setStatus({ phase: 'done', songs: done });
      setKpi(getKPISnapshot());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({ phase: 'error', message });
      setKpi(getKPISnapshot());
    }
  }, []);

  const extend = useCallback(
    async (songId: string, continueAt: number, prompt?: string) => {
      setStatus({ phase: 'generating', ids: [] });
      try {
        const initial = await extendSong(songId, continueAt, prompt);
        const ids = initial.map((s) => s.id);
        pollingStart.current = Date.now();
        setStatus({ phase: 'polling', ids, elapsed: 0 });
        const done = await pollUntilDone(ids);
        setSongs(done);
        setStatus({ phase: 'done', songs: done });
        setKpi(getKPISnapshot());
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStatus({ phase: 'error', message });
        setKpi(getKPISnapshot());
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus({ phase: 'idle' });
    setSongs([]);
  }, []);

  return { generate, extend, status, songs, kpi, reset };
}

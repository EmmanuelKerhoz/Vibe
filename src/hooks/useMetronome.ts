/**
 * @status dormant — implémentation complète, non exposée dans l'UI.
 * Candidat à intégration dans MusicalParamsPanel (métronome)
 * et StatusBar / SettingsPanel (storage estimate).
 */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Schedule a single tick sound at an exact AudioContext time.
 * Using a scheduled start time (not audioCtx.currentTime) eliminates
 * JS-thread jitter from the audio clock.
 */
function scheduleTick(audioCtx: AudioContext, atTime: number): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 880;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.3, atTime);
  gain.gain.exponentialRampToValueAtTime(0.001, atTime + 0.05);
  osc.start(atTime);
  osc.stop(atTime + 0.05);
}

/** Safe AudioContext factory — returns null if Web Audio API is unavailable. */
function createAudioContext(): AudioContext | null {
  try {
    if (typeof AudioContext !== 'undefined') return new AudioContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WebkitAC = (window as any).webkitAudioContext;
    if (typeof WebkitAC !== 'undefined') return new WebkitAC() as AudioContext;
    return null;
  } catch {
    return null;
  }
}

export interface UseMetronomeReturn {
  /** Whether the metronome is currently running. */
  isPlaying: boolean;
  /** Whether a beat has just fired (resets after 120 ms — use for flash animations). */
  isBeat: boolean;
  /**
   * Toggle the metronome on / off.
   * Returns a Promise that resolves once the AudioContext has resumed (if it was suspended).
   * Safe to call fire-and-forget — callers that don't await it are unaffected.
   */
  toggle: () => Promise<void>;
  /** Stop the metronome if it is running. */
  stop: () => void;
}

/**
 * Metronome hook — Web Audio lookahead scheduler for jitter-free audio,
 * requestAnimationFrame for pixel-perfect visual sync.
 *
 * Architecture:
 *   - A lightweight setInterval (every ~25 ms) schedules audio beats
 *     AHEAD of time (lookaheadSec = 0.1 s) via AudioContext.currentTime.
 *   - A requestAnimationFrame loop fires setIsBeat(true) exactly when
 *     audioCtx.currentTime crosses the next scheduled beat time,
 *     producing visual/audio sync independent of JS render timing.
 *
 * @param bpm Beats per minute. Clamped to [20, 300].
 */
export function useMetronome(bpm: number): UseMetronomeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBeat, setIsBeat] = useState(false);

  const audioCtxRef       = useRef<AudioContext | null>(null);
  const nextBeatTimeRef   = useRef<number>(0);      // AudioContext clock of the next beat
  const schedulerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef            = useRef<number | null>(null);
  const beatFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef      = useRef(false);           // mirror for RAF closure
  const intervalMsRef     = useRef<number>(500);     // current beat interval in ms

  // Keep ref in sync with state so the RAF closure always has live values.
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const safeBpm = Math.min(300, Math.max(20, bpm || 120));

  // ── Lookahead scheduler ──────────────────────────────────────────────────
  const LOOKAHEAD_SEC        = 0.1;
  const SCHEDULER_INTERVAL_MS = 25;

  const runScheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const intervalSec = intervalMsRef.current / 1000;
    while (nextBeatTimeRef.current < ctx.currentTime + LOOKAHEAD_SEC) {
      scheduleTick(ctx, nextBeatTimeRef.current);
      nextBeatTimeRef.current += intervalSec;
    }
  }, []);

  // ── Visual sync via requestAnimationFrame ────────────────────────────────
  const FLASH_DURATION_MS = 120;
  const nextVisualBeatRef = useRef<number>(0);

  const rafLoop = useCallback(() => {
    if (!isPlayingRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx && ctx.currentTime >= nextVisualBeatRef.current) {
      const intervalSec = intervalMsRef.current / 1000;
      while (nextVisualBeatRef.current <= ctx.currentTime) {
        nextVisualBeatRef.current += intervalSec;
      }
      setIsBeat(true);
      if (beatFlashTimerRef.current) clearTimeout(beatFlashTimerRef.current);
      beatFlashTimerRef.current = setTimeout(() => setIsBeat(false), FLASH_DURATION_MS);
    }
    rafRef.current = requestAnimationFrame(rafLoop);
  }, []);

  // ── Start / stop helpers ─────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (schedulerRef.current) { clearInterval(schedulerRef.current); schedulerRef.current = null; }
    if (rafRef.current)        { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (beatFlashTimerRef.current) { clearTimeout(beatFlashTimerRef.current); beatFlashTimerRef.current = null; }
    setIsBeat(false);
  }, []);

  const stop = useCallback(() => {
    stopAll();
    setIsPlaying(false);
  }, [stopAll]);

  /**
   * FIX: toggle is now async so that AudioContext.resume() is awaited before
   * setIsPlaying(true). Previously, the scheduler started firing while the
   * context was still suspended (autoplay policy on iOS / Chrome strict mode),
   * producing isPlaying=true with no audio output.
   */
  const toggle = useCallback(async () => {
    if (isPlaying) {
      stop();
    } else {
      if (!audioCtxRef.current) {
        audioCtxRef.current = createAudioContext();
        if (!audioCtxRef.current) return; // Web Audio not supported — bail silently
      } else if (audioCtxRef.current.state === 'suspended') {
        try {
          await audioCtxRef.current.resume();
        } catch {
          // If resume fails (e.g. policy enforcement), bail without starting
          return;
        }
      }
      setIsPlaying(true);
    }
  }, [isPlaying, stop]);

  // ── Effect: start/restart loop when isPlaying or bpm changes ────────────
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = (60 / safeBpm) * 1000;
    intervalMsRef.current = intervalMs;

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    nextBeatTimeRef.current  = ctx.currentTime;
    nextVisualBeatRef.current = ctx.currentTime;

    runScheduler();
    schedulerRef.current = setInterval(runScheduler, SCHEDULER_INTERVAL_MS);
    rafRef.current = requestAnimationFrame(rafLoop);

    return () => stopAll();
  }, [isPlaying, safeBpm, runScheduler, rafLoop, stopAll]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAll();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stopAll]);

  return { isPlaying, isBeat, toggle, stop };
}

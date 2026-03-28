/**
 * @status dormant — implémentation complète, non exposée dans l'UI.
 * Candidat à intégration dans MusicalParamsPanel (métronome)
 * et StatusBar / SettingsPanel (storage estimate).
 */
import { useState, useEffect, useRef, useCallback } from 'react';

// Type-safe detection of the webkit-prefixed AudioContext fallback.
// Mirrors the pattern used in useAudioFeedback for consistency.
type WindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

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

/**
 * Creates (or reuses) an AudioContext with webkit fallback and try/catch.
 * Returns null if AudioContext is unavailable in the current environment.
 * Aligned with the pattern from useAudioFeedback.
 */
function getOrCreateAudioContext(ref: React.MutableRefObject<AudioContext | null>): AudioContext | null {
  if (ref.current) return ref.current;
  try {
    const win = window as WindowWithWebkitAudio;
    const Ctor = window.AudioContext ?? win.webkitAudioContext;
    if (!Ctor) return null;
    ref.current = new Ctor();
    return ref.current;
  } catch {
    return null;
  }
}

export interface UseMetronomeReturn {
  /** Whether the metronome is currently running. */
  isPlaying: boolean;
  /** Whether a beat has just fired (resets after 120 ms — use for flash animations). */
  isBeat: boolean;
  /** Toggle the metronome on / off. */
  toggle: () => void;
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

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      // Feature-detected AudioContext creation — aligned with useAudioFeedback.
      // Returns early (isPlaying stays false) if AudioContext is unavailable,
      // preventing the state/audio desync of the previous implementation.
      const ctx = getOrCreateAudioContext(audioCtxRef);
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
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
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [stopAll]);

  return { isPlaying, isBeat, toggle, stop };
}

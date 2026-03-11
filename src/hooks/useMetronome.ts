import { useState, useEffect, useRef, useCallback } from 'react';

/** Play a single short tick using the Web Audio API. */
function tick(audioCtx: AudioContext): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 880;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.05);
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
 * Metronome hook — uses the Web Audio API for audio ticks and a simple
 * `setInterval` for timing.  No external dependencies.
 *
 * @param bpm Beats per minute (taken from the tempo field). Clamped to [20, 300].
 */
export function useMetronome(bpm: number): UseMetronomeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBeat, setIsBeat] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeBpm = Math.min(300, Math.max(20, bpm || 120));

  /** Fire one visual + audio beat. */
  const fireBeat = useCallback(() => {
    if (!audioCtxRef.current) return;
    tick(audioCtxRef.current);
    setIsBeat(true);
    if (beatTimerRef.current) clearTimeout(beatTimerRef.current);
    beatTimerRef.current = setTimeout(() => setIsBeat(false), 120);
  }, []);

  /** Start the interval loop. */
  const startLoop = useCallback((intervalMs: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Fire immediately on start, then repeat.
    fireBeat();
    intervalRef.current = setInterval(() => fireBeat(), intervalMs);
  }, [fireBeat]);

  /** Stop and clear all timers. */
  const stopLoop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (beatTimerRef.current) { clearTimeout(beatTimerRef.current); beatTimerRef.current = null; }
    setIsBeat(false);
  }, []);

  const stop = useCallback(() => {
    stopLoop();
    setIsPlaying(false);
  }, [stopLoop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      // Create / resume AudioContext lazily (required by browser autoplay policy).
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      } else if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
      setIsPlaying(true);
    }
  }, [isPlaying, stop]);

  // Restart the interval whenever bpm changes while playing.
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = (60 / safeBpm) * 1000;
    startLoop(intervalMs);
    return () => stopLoop();
  }, [isPlaying, safeBpm, startLoop, stopLoop]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopLoop();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stopLoop]);

  return { isPlaying, isBeat, toggle, stop };
}

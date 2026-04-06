import { useCallback, useEffect, useRef } from 'react';

// Type-safe detection of the webkit-prefixed AudioContext fallback.
// Avoids `any` cast while remaining compatible with older mobile browsers.
type WindowWithWebkitAudio = Window & typeof globalThis & {
  AudioContext: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

export const useAudioFeedback = (audioFeedback: boolean) => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (!audioCtxRef.current) {
      try {
        const win = window as WindowWithWebkitAudio;
        const Ctor = window.AudioContext ?? win.webkitAudioContext;
        if (!Ctor) return null;
        audioCtxRef.current = new Ctor();
      } catch {
        return null;
      }
    }
    return audioCtxRef.current;
  }, []);

  // Close the AudioContext when the hook unmounts to release the OS audio
  // resource. Safari iOS enforces a hard limit of 6 concurrent AudioContexts;
  // without cleanup the app exhausts them after a few remounts (e.g. HMR, SSR
  // hydration, StrictMode double-mount in dev).
  useEffect(() => {
    return () => {
      const ctx = audioCtxRef.current;
      if (ctx) {
        ctx.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const playAudioFeedback = useCallback(async (type: 'click' | 'success' | 'error' | 'drag' | 'drop') => {
    if (!audioFeedback) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // FIX: await resume() before touching the graph — on iOS Safari the
      // context stays suspended for several frames after the call returns,
      // and starting an oscillator in a suspended context produces silence.
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch { return; }
      }
      // Guard: if still not running after resume (e.g. no user gesture yet),
      // skip rather than produce silence.
      if (ctx.state !== 'running') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'drag') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'drop') {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // Ignore audio context errors silently — non-critical UX feature.
    }
  }, [audioFeedback, getAudioContext]);

  // Stable ref so the global click listener never re-registers on audioFeedback toggle.
  // The ref is updated synchronously after every render so the handler always
  // closes over the latest playAudioFeedback without triggering a new effect.
  // Exposed in the return value so callers (e.g. useAppOrchestration) can use
  // the same ref without duplicating the ref management.
  const playAudioFeedbackRef = useRef(playAudioFeedback);
  useEffect(() => { playAudioFeedbackRef.current = playAudioFeedback; }, [playAudioFeedback]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Exclude text-entry and form controls — audio feedback on inputs is
      // disruptive and semantically incorrect (not an action affordance).
      if (
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select')
      ) return;
      if (
        target.closest('button') ||
        target.closest('.fluent-button')
      ) {
        playAudioFeedbackRef.current('click');
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []); // mount-only — ref keeps the callback fresh without re-registering

  return { playAudioFeedback, playAudioFeedbackRef };
};

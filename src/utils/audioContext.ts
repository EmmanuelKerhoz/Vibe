/**
 * audioContext.ts — shared AudioContext factory.
 *
 * Centralises feature detection and webkit fallback so that
 * useAudioFeedback and useMetronome don't duplicate the same pattern.
 *
 * Returns null when the Web Audio API is unavailable (e.g. jsdom, old Safari).
 */

interface WindowWithWebkitAudio extends Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Creates a new AudioContext (or webkitAudioContext on older Safari).
 * Returns null when the API is unavailable or throws on construction.
 */
export function createAudioContext(): AudioContext | null {
  try {
    const win = window as WindowWithWebkitAudio;
    const Ctor = win.AudioContext ?? win.webkitAudioContext;
    if (!Ctor) return null;
    return new Ctor();
  } catch {
    return null;
  }
}

/**
 * Resumes a suspended AudioContext (required after user-gesture policy
 * on Safari mobile and some desktop browsers).
 *
 * Returns true if the context is running after the call, false if it
 * could not be resumed (Permissions Policy, gesture guard, etc.).
 * Never throws — callers can safely fire-and-forget.
 */
export async function resumeAudioContext(ctx: AudioContext): Promise<boolean> {
  if (ctx.state !== 'suspended') return ctx.state === 'running';
  try {
    await ctx.resume();
    return ctx.state === 'running';
  } catch (e) {
    console.warn('[audioContext] Failed to resume AudioContext:', e);
    return false;
  }
}

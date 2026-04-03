/**
 * audioContext.ts — shared AudioContext factory.
 *
 * Centralises feature detection and webkit fallback so that
 * useAudioFeedback and useMetronome don't duplicate the same pattern.
 *
 * Returns null when the Web Audio API is unavailable (e.g. jsdom, old Safari).
 */

interface WindowWithWebkitAudio extends Window {
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
 */
export async function resumeAudioContext(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

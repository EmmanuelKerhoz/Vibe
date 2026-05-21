interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: {
      [altIndex: number]: { transcript: string };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

type WindowWithSpeechRecognition = Window & typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionConstructorLike;
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
};

// Practical threshold for cold-start TTS voices, especially on mobile browsers.
export const VOICE_SPEECH_SLOW_START_MS = 1800;

export interface VoiceAudioService {
  isRecognitionSupported: () => boolean;
  isSpeechSupported: () => boolean;
  listenOnce: (language?: string) => Promise<string>;
  speak: (text: string, options?: { lang?: string; slowStartMs?: number; onSlowStart?: () => void }) => Promise<boolean>;
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === 'undefined') return null;
  const withSpeech = window as WindowWithSpeechRecognition;
  return withSpeech.SpeechRecognition ?? withSpeech.webkitSpeechRecognition ?? null;
}

/**
 * Resolve the best available SpeechSynthesisVoice for a given BCP-47 locale.
 *
 * Strategy (in priority order):
 *  1. Local voice whose lang starts with the requested locale code.
 *  2. Any (remote/network) voice whose lang starts with the requested locale code.
 *  3. null — browser will use its default voice.
 *
 * getVoices() may return an empty list before the `voiceschanged` event fires.
 * The caller (speak()) handles this by scheduling a retry via the event.
 */
function resolveVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const prefix = lang.toLowerCase().slice(0, 2); // e.g. "fr" from "fr-FR"
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const matching = voices.filter(v => v.lang.toLowerCase().startsWith(prefix));
  if (!matching.length) return null;
  // Prefer local (on-device) voice for reliability and lower latency.
  return matching.find(v => v.localService) ?? matching[0] ?? null;
}

export class BrowserVoiceAudioService implements VoiceAudioService {
  isRecognitionSupported(): boolean {
    return getSpeechRecognitionCtor() !== null;
  }

  isSpeechSupported(): boolean {
    return typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  listenOnce(language = 'fr-FR'): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognitionCtor = getSpeechRecognitionCtor();
      if (!SpeechRecognitionCtor) {
        reject(new Error('Speech recognition is not supported in this browser.'));
        return;
      }

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = language;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let transcript = '';
      recognition.onresult = (event) => {
        const firstResult = event.results[0];
        const firstAlt = firstResult?.[0];
        transcript = firstAlt?.transcript?.trim() ?? '';
      };
      recognition.onerror = (event) => {
        reject(new Error(event.error ?? 'Speech recognition error.'));
      };
      recognition.onend = () => {
        if (transcript) resolve(transcript);
        else reject(new Error('No voice input captured.'));
      };
      recognition.start();
    });
  }

  speak(
    text: string,
    options?: { lang?: string; slowStartMs?: number; onSlowStart?: () => void },
  ): Promise<boolean> {
    if (!this.isSpeechSupported()) return Promise.resolve(false);

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const synth = window.speechSynthesis;
      const lang = options?.lang ?? 'fr-FR';
      const slowStartMs = options?.slowStartMs ?? VOICE_SPEECH_SLOW_START_MS;
      let resolved = false;
      let started = false;

      // Set the BCP-47 language on the utterance so the browser picks
      // an appropriate voice even if resolveVoice() returns null.
      utterance.lang = lang;

      const settle = (spoken: boolean) => {
        if (resolved) return;
        resolved = true;
        resolve(spoken);
      };

      const doSpeak = () => {
        const voice = resolveVoice(lang);
        if (voice) utterance.voice = voice;

        const slowTimer = window.setTimeout(() => {
          if (started) return;
          options?.onSlowStart?.();
          synth.cancel();
          settle(false);
        }, slowStartMs);

        utterance.onstart = () => { started = true; };
        utterance.onend = () => { window.clearTimeout(slowTimer); settle(started); };
        utterance.onerror = () => { window.clearTimeout(slowTimer); settle(false); };

        // Always clear queued/pending utterances first so rapid re-invocations
        // replace prior speech instead of overlapping with it.
        synth.cancel();
        synth.speak(utterance);
      };

      // Voices may not be loaded yet on first call — wait for voiceschanged.
      const voices = synth.getVoices();
      if (voices.length > 0) {
        doSpeak();
      } else {
        const onVoicesChanged = () => {
          synth.removeEventListener('voiceschanged', onVoicesChanged);
          doSpeak();
        };
        synth.addEventListener('voiceschanged', onVoicesChanged);
        // Safety fallback: if the event never fires, speak anyway after a short delay.
        window.setTimeout(() => {
          synth.removeEventListener('voiceschanged', onVoicesChanged);
          if (!resolved) doSpeak();
        }, 500);
      }
    });
  }
}

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { EditMode } from '../../types';
import {
  BrowserVoiceAudioService,
  type VoiceAudioService,
  VOICE_SPEECH_SLOW_START_MS,
} from './voiceAssistantAudioService';
import { requestVoiceAssistantReply, type VoiceAssistantContext } from './voiceAssistantOrchestrator';
import { useVoiceAssistantState } from './useVoiceAssistantState';
import { useUiSpeechLocale } from './useUiSpeechLocale';
import { LanguageContext } from '../../i18n/LanguageProvider';

export type VoiceAssistantUiState = 'idle' | 'listening' | 'processing' | 'speaking';

interface ControllerDependencies {
  audioService?: VoiceAudioService;
  requestReply?: (query: string, context: VoiceAssistantContext) => Promise<string>;
}

interface UseVoiceAssistantControllerParams extends ControllerDependencies {
  enabled: boolean;
  page: 'lyrics' | 'musical' | 'player';
  mode: EditMode;
}

// English fallbacks used when the active locale omits a key or no
// LanguageProvider is present (tests, SSR).
const FALLBACK_MESSAGES = {
  prompt: 'What do you want to know or do?',
  noInput: 'I did not catch your request. Please try speaking again.',
  unavailable: 'Voice input is not available in this browser.',
  error: 'Voice assistant error.',
} as const;

export function useVoiceAssistantController({
  enabled,
  page,
  mode,
  audioService,
  requestReply = requestVoiceAssistantReply,
}: UseVoiceAssistantControllerParams) {
  const { context, isFirstCall, markFirstCallHandled } = useVoiceAssistantState({ page, mode });
  const defaultAudioService = useMemo(() => new BrowserVoiceAudioService(), []);
  const audio = audioService ?? defaultAudioService;

  // Resolve the active UI language so STT/TTS and the AI reply all match it.
  const langCtx = useContext(LanguageContext);
  const { uiLocaleCode, bcpTag } = useUiSpeechLocale();

  // Localized user-facing messages, falling back to English literals.
  // Memoised so the object identity is stable when the locale has not changed,
  // preventing spurious invalidation of the invoke callback.
  const voiceMessages = (langCtx?.t.voice ?? {}) as Partial<typeof FALLBACK_MESSAGES>;
  const messages = useMemo(() => ({
    prompt: voiceMessages.prompt ?? FALLBACK_MESSAGES.prompt,
    noInput: voiceMessages.noInput ?? FALLBACK_MESSAGES.noInput,
    unavailable: voiceMessages.unavailable ?? FALLBACK_MESSAGES.unavailable,
    error: voiceMessages.error ?? FALLBACK_MESSAGES.error,
  }), [
    voiceMessages.prompt,
    voiceMessages.noInput,
    voiceMessages.unavailable,
    voiceMessages.error,
  ]);

  const [uiState, setUiState] = useState<VoiceAssistantUiState>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [textFallback, setTextFallback] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string | null>(null);

  // Guard setState calls in async paths against component unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const isBusy = uiState !== 'idle';

  const invoke = useCallback(async () => {
    if (!enabled || uiState !== 'idle') return;

    setErrorText(null);
    setTextFallback(null);
    setPromptText(messages.prompt);

    if (!audio.isRecognitionSupported()) {
      setErrorText(messages.unavailable);
      return;
    }

    try {
      setUiState('listening');
      // Pass UI locale to STT so recognition targets the correct language.
      const query = await audio.listenOnce(bcpTag);
      if (!query.trim()) throw new Error(messages.noInput);

      setUiState('processing');
      const voiceContext: VoiceAssistantContext = { ...context, isFirstCall, uiLocaleCode };
      const reply = await requestReply(query, voiceContext);
      if (isFirstCall) markFirstCallHandled();

      setUiState('speaking');
      // Pass UI locale to TTS so the browser selects a matching voice.
      const spoken = await audio.speak(reply, {
        lang: bcpTag,
        slowStartMs: VOICE_SPEECH_SLOW_START_MS,
        onSlowStart: () => { if (mountedRef.current) setTextFallback(reply); },
      });

      if (mountedRef.current) {
        if (!spoken) setTextFallback(reply);
        setUiState('idle');
      }
    } catch (error) {
      if (mountedRef.current) {
        const message = error instanceof Error ? error.message : messages.error;
        setErrorText(message);
        setUiState('idle');
      }
    }
  }, [audio, bcpTag, context, enabled, isFirstCall, markFirstCallHandled, messages, requestReply, uiLocaleCode, uiState]);

  return {
    invoke,
    uiState,
    promptText,
    textFallback,
    errorText,
    isBusy,
  };
}

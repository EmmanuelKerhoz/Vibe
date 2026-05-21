import { useCallback, useContext, useMemo, useState } from 'react';
import type { EditMode } from '../../types';
import {
  BrowserVoiceAudioService,
  type VoiceAudioService,
  VOICE_SPEECH_SLOW_START_MS,
} from './voiceAssistantAudioService';
import { requestVoiceAssistantReply, type VoiceAssistantContext } from './voiceAssistantOrchestrator';
import { useVoiceAssistantState } from './useVoiceAssistantState';
import { LanguageContext } from '../../i18n/LanguageProvider';
import { langIdToLocaleCode } from '../../i18n/constants';

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

const NO_INPUT_CAPTURED_TEXT = 'I did not catch your request. Please try speaking again.';

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

  // Derive BCP-47 locale code from the active UI language (e.g. 'ui:fr' → 'fr').
  // Falls back to 'en' when LanguageContext is not available (tests, SSR).
  const langCtx = useContext(LanguageContext);
  const uiLocaleCode = langCtx ? langIdToLocaleCode(langCtx.language) : 'en';
  // Full BCP-47 tag for Web Speech API (e.g. 'fr' → 'fr-FR').
  const bcpTag = uiLocaleCode.includes('-') ? uiLocaleCode : `${uiLocaleCode}-${uiLocaleCode.toUpperCase()}`;

  const [uiState, setUiState] = useState<VoiceAssistantUiState>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [textFallback, setTextFallback] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string | null>(null);

  const isBusy = uiState !== 'idle';

  const invoke = useCallback(async () => {
    if (!enabled || uiState !== 'idle') return;

    setErrorText(null);
    setTextFallback(null);
    setPromptText('What do you want to know or do?');

    if (!audio.isRecognitionSupported()) {
      setErrorText('Voice input is not available in this browser.');
      return;
    }

    try {
      setUiState('listening');
      // Pass UI locale to STT so recognition targets the correct language.
      const query = await audio.listenOnce(bcpTag);
      if (!query.trim()) throw new Error(NO_INPUT_CAPTURED_TEXT);

      setUiState('processing');
      const voiceContext: VoiceAssistantContext = { ...context, isFirstCall, uiLocaleCode };
      const reply = await requestReply(query, voiceContext);
      if (isFirstCall) markFirstCallHandled();

      setUiState('speaking');
      // Pass UI locale to TTS so the browser selects a matching voice.
      const spoken = await audio.speak(reply, {
        lang: bcpTag,
        slowStartMs: VOICE_SPEECH_SLOW_START_MS,
        onSlowStart: () => setTextFallback(reply),
      });

      if (!spoken) setTextFallback(reply);
      setUiState('idle');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Voice assistant error.';
      setErrorText(message);
      setUiState('idle');
    }
  }, [audio, bcpTag, context, enabled, isFirstCall, markFirstCallHandled, requestReply, uiLocaleCode, uiState]);

  return {
    invoke,
    uiState,
    promptText,
    textFallback,
    errorText,
    isBusy,
  };
}

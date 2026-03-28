import { useEffect, useMemo, useRef, useState } from 'react';
import type { Section } from '../types';
import { languageNameToCode } from '../constants/langFamilyMap';
import { runIPAPipelineBatch, type IPAPipelineResult } from '../utils/ipaPipeline';
import { syllabifyLineFrench } from '../utils/frenchSyllabifier';
import { getLanguageDisplay } from '../i18n';

type PhoneticState = {
  text: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  languageLabel: string;
  error: string | null;
};

type UsePhoneticTranscriptionParams = {
  song: Section[];
  sectionTargetLanguages?: Record<string, string>;
  songLanguage?: string;
  targetLanguage?: string;
  isActive: boolean;
};

const normalizeLangCode = (raw: string | undefined): { code: string; label: string } => {
  const fallbackLabel = raw?.trim() || 'English';
  const normalized = fallbackLabel.toLowerCase();
  return {
    code: languageNameToCode(fallbackLabel) || normalized || 'en',
    label: getLanguageDisplay(fallbackLabel).label,
  };
};

const buildSectionPhonetics = async (
  section: Section,
  langCode: string,
  signal: AbortSignal
): Promise<{ header: string; body: string }> => {
  // French: apply local graphemic syllabification instead of remote IPA pipeline
  if (langCode === 'fr') {
    const syllabifiedLines = section.lines.map(line => {
      const trimmed = line.text.trim();
      if (!trimmed) return '';
      if (line.isMeta) return line.text;
      return syllabifyLineFrench(line.text);
    });
    return {
      header: `[${section.name}]`,
      body: syllabifiedLines.join('\n'),
    };
  }

  const phonemizeTargets = section.lines
    .map((line, index) => ({ line, index, text: line.text.trim() }))
    .filter(item => item.text.length > 0 && !item.line.isMeta);

  const responses: IPAPipelineResult[] = phonemizeTargets.length > 0
    ? await runIPAPipelineBatch(phonemizeTargets.map(t => t.text), langCode, signal)
    : [];

  let responseIdx = 0;
  const ipaLines = section.lines.map(line => {
    const trimmed = line.text.trim();
    if (!trimmed) return '';
    if (line.isMeta) return line.text;

    const response = responses[responseIdx++];
    if (!response || !response.success) return line.text;
    return response.ipa || response.text || line.text;
  });

  return {
    header: `[${section.name}]`,
    body: ipaLines.filter(l => l !== undefined).join('\n'),
  };
};

export function usePhoneticTranscription({
  song,
  sectionTargetLanguages = {},
  songLanguage,
  targetLanguage,
  isActive,
}: UsePhoneticTranscriptionParams): PhoneticState {
  const [state, setState] = useState<PhoneticState>({
    text: '',
    status: 'idle',
    languageLabel: getLanguageDisplay(songLanguage || targetLanguage || 'English').label,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const languagePerSection = useMemo(() => {
    const baseLang = normalizeLangCode(songLanguage || targetLanguage || 'English');
    return song.map(section => {
      const raw = sectionTargetLanguages[section.id] || songLanguage || targetLanguage || baseLang.label;
      const normalized = normalizeLangCode(raw);
      return { sectionId: section.id, ...normalized };
    });
  }, [song, sectionTargetLanguages, songLanguage, targetLanguage]);

  useEffect(() => {
    abortRef.current?.abort();

    if (!isActive) {
      setState(prev => ({
        ...prev,
        status: 'idle',
        error: null,
      }));
      return;
    }

    if (song.length === 0) {
      setState(prev => ({
        ...prev,
        text: '',
        status: 'ready',
        error: null,
      }));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      setState(prev => ({
        ...prev,
        status: 'loading',
        error: null,
      }));

      try {
        const sections = await Promise.all(song.map(async section => {
          const langInfo = languagePerSection.find(l => l.sectionId === section.id) ?? normalizeLangCode(songLanguage || targetLanguage || 'English');
          return buildSectionPhonetics(section, langInfo.code || 'en', controller.signal);
        }));

        if (controller.signal.aborted) return;

        const nextText = sections
          .map(block => `${block.header}\n${block.body}`.trim())
          .join('\n\n')
          .trim();

        setState({
          text: nextText,
          status: 'ready',
          languageLabel: languagePerSection[0]?.label ?? getLanguageDisplay(songLanguage || targetLanguage || 'English').label,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          status: 'error',
          error: message,
        }));
      }
    };

    void run();

    return () => controller.abort();
  }, [isActive, song, languagePerSection, songLanguage, targetLanguage]);

  return state;
}

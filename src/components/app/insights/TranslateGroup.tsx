import { useCallback } from 'react';
import { Loader2, Languages } from '../../ui/icons';
import { LcarsSelect } from '../../ui/LcarsSelect';
import { Tooltip } from '../../ui/Tooltip';
import { EmojiSign } from '../../ui/EmojiSign';
import { useTranslation } from '../../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES } from '../../../i18n';
import type { Section } from '../../../types';

interface TranslateGroupProps {
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isAdaptingLanguage: boolean;
  song: Section[];
  adaptSongLanguage: (lang: string) => void;
  showTranslationFeatures: boolean;
  hasApiKey: boolean;
}

const LANGUAGE_SELECT_OPTIONS = SUPPORTED_ADAPTATION_LANGUAGES.map(lang => ({
  value: lang.aiName,
  label: (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      <EmojiSign sign={lang.sign} />
      <span className="truncate">{lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}</span>
    </span>
  ),
}));

export function TranslateGroup({
  targetLanguage,
  setTargetLanguage,
  isAdaptingLanguage,
  song,
  adaptSongLanguage,
  showTranslationFeatures,
  hasApiKey,
}: TranslateGroupProps) {
  const { t } = useTranslation();
  const isDisabled = !hasApiKey || isAdaptingLanguage || song.length === 0;
  const tooltipTitle = !hasApiKey
    ? (t.tooltips.aiUnavailable ?? 'AI unavailable')
    : 'Select a target language to adapt the entire song';

  const handleLanguageSelect = useCallback((lang: string) => {
    setTargetLanguage(lang);
    if (!isDisabled) {
      adaptSongLanguage(lang);
    }
  }, [setTargetLanguage, isDisabled, adaptSongLanguage]);

  if (!showTranslationFeatures) {
    return null;
  }

  const triggerContent = (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      {isAdaptingLanguage
        ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" aria-hidden="true" />
        : <Languages className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
      <span className="truncate text-[10px] font-bold uppercase tracking-wider">
        {t.editor.adaptation ?? 'Adaptation'}
      </span>
    </span>
  );

  return (
    <Tooltip title={tooltipTitle}>
      <div className="min-w-0 overflow-hidden" style={{ maxWidth: '180px' }}>
        <LcarsSelect
          value={targetLanguage}
          onChange={handleLanguageSelect}
          options={LANGUAGE_SELECT_OPTIONS}
          triggerLabel={triggerContent}
          disabled={isDisabled}
        />
      </div>
    </Tooltip>
  );
}

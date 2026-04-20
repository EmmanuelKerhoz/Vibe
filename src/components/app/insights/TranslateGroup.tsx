import { useCallback } from 'react';
import { Loader2, Languages } from '../../ui/icons';
import { LcarsSelect } from '../../ui/LcarsSelect';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';
import { useCustomLanguageSelector } from '../../../hooks/useCustomLanguageSelector';
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
  const isBaseDisabled = !hasApiKey || isAdaptingLanguage || song.length === 0;

  const handleValueChange = useCallback(
    (lang: string) => {
      setTargetLanguage(lang);
      if (!isBaseDisabled) adaptSongLanguage(lang);
    },
    [setTargetLanguage, isBaseDisabled, adaptSongLanguage],
  );

  const {
    selectValue,
    customText,
    customInputRef,
    showCustomInput,
    effectiveLang,
    languageOptions,
    handleLanguageSelect,
    handleCustomTextChange,
  } = useCustomLanguageSelector({
    storedValue: targetLanguage,
    onValueChange: handleValueChange,
  });

  const handleCustomSubmit = useCallback(() => {
    if (!effectiveLang || isBaseDisabled) return;
    adaptSongLanguage(effectiveLang);
  }, [effectiveLang, isBaseDisabled, adaptSongLanguage]);

  const tooltipTitle = !hasApiKey
    ? (t.tooltips.aiUnavailable ?? 'AI unavailable')
    : 'Select a target language to adapt the entire song';

  if (!showTranslationFeatures) return null;

  const triggerContent = (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      {isAdaptingLanguage
        ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" aria-hidden="true" />
        : <Languages className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
      <span className="truncate text-[11px] font-bold uppercase tracking-wider">
        {t.editor.adaptation ?? 'Adaptation'}
      </span>
    </span>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tooltip title={tooltipTitle}>
        <div className="min-w-0 overflow-hidden" style={{ maxWidth: '180px' }}>
          <LcarsSelect
            value={selectValue}
            onChange={handleLanguageSelect}
            options={languageOptions}
            triggerLabel={triggerContent}
            disabled={isBaseDisabled && !showCustomInput}
          />
        </div>
      </Tooltip>

      {showCustomInput && (
        <input
          ref={customInputRef}
          type="text"
          value={customText}
          onChange={handleCustomTextChange}
          placeholder="e.g. Scots Gaelic…"
          maxLength={80}
          className="flex-1 min-w-[9rem] max-w-[16rem] px-2 py-1 rounded text-[11px]"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-color, var(--border-color))',
            color: 'var(--text-primary)',
            outline: 'none',
            borderRadius: '6px 2px 6px 2px',
          }}
          aria-label="Custom adaptation language"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCustomSubmit();
          }}
          disabled={isBaseDisabled}
        />
      )}
    </div>
  );
}

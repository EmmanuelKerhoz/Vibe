import React, { useCallback } from 'react';
import { Loader2, Languages, Check } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { LcarsSelect } from '../ui/LcarsSelect';
import { useTranslation } from '../../i18n';
import { useCustomLanguageSelector } from '../../hooks/useCustomLanguageSelector';

interface SectionAdaptControlProps {
  sectionId: string;
  sectionTargetLanguage: string;
  hasApiKey: boolean;
  isGenerating: boolean;
  isAnalyzing: boolean;
  isAdaptingLanguage: boolean;
  onSectionTargetLanguageChange?: (sectionId: string, lang: string) => void;
  adaptSectionLanguage?: (sectionId: string, lang: string) => void;
}

export const SectionAdaptControl = React.memo(function SectionAdaptControl({
  sectionId,
  sectionTargetLanguage,
  hasApiKey,
  isGenerating,
  isAnalyzing,
  isAdaptingLanguage,
  onSectionTargetLanguageChange,
  adaptSectionLanguage,
}: SectionAdaptControlProps) {
  const { t } = useTranslation();

  const handleValueChange = useCallback(
    (lang: string) => onSectionTargetLanguageChange?.(sectionId, lang),
    [sectionId, onSectionTargetLanguageChange],
  );

  const {
    selectValue,
    customText,
    showCustomInput,
    effectiveLang,
    languageOptions,
    handleLanguageSelect,
    setCustomText,
    handleCustomConfirm,
  } = useCustomLanguageSelector({
    storedValue: sectionTargetLanguage,
    onValueChange: handleValueChange,
  });

  const canAdapt =
    !!adaptSectionLanguage &&
    hasApiKey &&
    !isGenerating &&
    !isAnalyzing &&
    !isAdaptingLanguage &&
    effectiveLang.length > 0;

  const isDirty = effectiveLang !== sectionTargetLanguage && effectiveLang.length > 0;

  const handleApply = useCallback(() => {
    if (!canAdapt) return;
    handleCustomConfirm();
    adaptSectionLanguage!(sectionId, effectiveLang);
  }, [canAdapt, handleCustomConfirm, adaptSectionLanguage, sectionId, effectiveLang]);

  if (!adaptSectionLanguage) return null;

  const applyTooltip = !hasApiKey
    ? (t.tooltips?.aiUnavailable ?? 'AI unavailable — configure an API key')
    : isDirty
      ? `Adapt this section to ${effectiveLang}`
      : `Section already set to ${effectiveLang}`;

  const selectTooltip = showCustomInput
    ? `Type a custom language in the dropdown filter, then pick "Other language…"`
    : 'Type to filter or pick a target language for this section';

  const triggerContent = (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      {isAdaptingLanguage
        ? <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
        : <Languages className="h-3 w-3 flex-shrink-0" />}
      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.15em]">
        {t.editor?.adaptation ?? 'Adaptation'}
      </span>
      {showCustomInput && customText && (
        <span
          className="truncate text-[11px] font-normal normal-case tracking-normal"
          style={{ opacity: 0.85 }}
        >
          · {customText}
        </span>
      )}
    </span>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tooltip title={selectTooltip}>
        <div className="min-w-[13rem] max-w-[18rem] flex-shrink-0">
          <LcarsSelect
            value={selectValue}
            onChange={handleLanguageSelect}
            options={languageOptions}
            accentColor="var(--lcars-cyan)"
            triggerLabel={triggerContent}
            disabled={false}
            searchable
            searchValue={showCustomInput ? customText : undefined}
            onSearchChange={showCustomInput ? setCustomText : undefined}
            searchPlaceholder="Type a language… (e.g. Fr → French)"
          />
        </div>
      </Tooltip>

      <Tooltip title={applyTooltip}>
        <button
          type="button"
          onClick={handleApply}
          disabled={!canAdapt || isAdaptingLanguage}
          aria-label={applyTooltip}
          className={[
            'flex items-center gap-1 px-2 py-0.5 rounded',
            'text-[10px] font-semibold uppercase tracking-[0.15em]',
            'border transition-colors duration-150',
            canAdapt && isDirty
              ? 'border-[var(--lcars-cyan)]/60 text-[var(--lcars-cyan)] hover:bg-[var(--lcars-cyan)]/10'
              : 'border-zinc-600/30 text-zinc-500 dark:text-zinc-600 cursor-not-allowed opacity-50',
          ].join(' ')}
        >
          {isAdaptingLanguage
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Check className="h-3 w-3" />}
          <span>{t.editor?.adaptApply ?? 'Apply'}</span>
        </button>
      </Tooltip>
    </div>
  );
});

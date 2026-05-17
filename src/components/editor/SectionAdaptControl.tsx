import React, { useCallback } from 'react';
import { Loader2, Languages, Check } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { LcarsSelect } from '../ui/LcarsSelect';
import { useTranslation } from '../../i18n';
import { useCustomLanguageSelector } from '../../hooks/useCustomLanguageSelector';
import type { AdaptationLangId } from '../../i18n/constants';

interface SectionAdaptControlProps {
  sectionId: string;
  sectionTargetLanguage: AdaptationLangId;
  hasApiKey: boolean;
  hasLyrics: boolean;
  isGenerating: boolean;
  isAnalyzing: boolean;
  isAdaptingLanguage: boolean;
  // Pending language driven externally from SectionEditor
  pendingLang: AdaptationLangId;
  onPendingLangChange: (lang: AdaptationLangId) => void;
  isDirty: boolean;
  onApply: () => void;
  adaptSectionLanguage?: (sectionId: string, lang: AdaptationLangId) => void;
}

export const SectionAdaptControl = React.memo(function SectionAdaptControl({
  sectionId,
  sectionTargetLanguage,
  hasApiKey,
  hasLyrics,
  isGenerating,
  isAnalyzing,
  isAdaptingLanguage,
  pendingLang,
  onPendingLangChange,
  isDirty,
  onApply,
  adaptSectionLanguage,
}: SectionAdaptControlProps) {
  const { t } = useTranslation();

  const {
    selectValue,
    customText,
    showCustomInput,
    languageOptions,
    handleLanguageSelect,
    setCustomText,
  } = useCustomLanguageSelector({
    storedValue: pendingLang,
    onValueChange: (lang: string) => onPendingLangChange(lang as AdaptationLangId),
  });

  const canApply =
    isDirty &&
    !isGenerating &&
    !isAnalyzing &&
    !isAdaptingLanguage &&
    // lang-specific guard: if lang changed, need api key and lyrics
    (hasApiKey && hasLyrics || true); // section type / rhyme always committable

  // For the Apply button label/tooltip we compute whether the lang part is actionable
  const langActionable =
    !!adaptSectionLanguage &&
    hasApiKey &&
    hasLyrics &&
    pendingLang.length > 0;

  const handleSearchEnter = useCallback((): boolean => {
    if (!showCustomInput) return false;
    if (canApply) onApply();
    return true;
  }, [showCustomInput, canApply, onApply]);

  if (!adaptSectionLanguage) return null;

  const applyTooltip = !isDirty
    ? 'No pending changes'
    : !hasApiKey
      ? (t.tooltips?.aiUnavailable ?? 'AI unavailable — configure an API key')
      : !hasLyrics
        ? 'No lyrics to adapt — add content first'
        : 'Apply all pending changes to this section';

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

  const customSearchProps = showCustomInput
    ? { searchValue: customText, onSearchChange: setCustomText }
    : {};

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
            {...customSearchProps}
            searchPlaceholder="Type a language… (e.g. Fr → French)"
            onSearchEnter={handleSearchEnter}
          />
        </div>
      </Tooltip>

      <Tooltip title={applyTooltip}>
        <button
          type="button"
          onClick={onApply}
          disabled={!canApply || isAdaptingLanguage}
          aria-label={applyTooltip}
          className={[
            'flex items-center gap-1 px-2 py-0.5 rounded',
            'text-[10px] font-semibold uppercase tracking-[0.15em]',
            'border transition-colors duration-150',
            canApply && !isAdaptingLanguage
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

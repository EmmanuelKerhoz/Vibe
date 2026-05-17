import React, { useCallback } from 'react';
import { Loader2, Languages } from '../ui/icons';
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
  sectionId: _sectionId,
  sectionTargetLanguage: _sectionTargetLanguage,
  hasApiKey: _hasApiKey,
  hasLyrics: _hasLyrics,
  isGenerating: _isGenerating,
  isAnalyzing: _isAnalyzing,
  isAdaptingLanguage,
  pendingLang,
  onPendingLangChange,
  isDirty: _isDirty,
  onApply: _onApply,
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

  const handleSearchEnter = useCallback((): boolean => {
    // Search enter no longer triggers apply — APPLY button is the sole commit point
    return false;
  }, []);

  if (!adaptSectionLanguage) return null;

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
    </div>
  );
});

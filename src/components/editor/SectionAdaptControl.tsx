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
    customInputRef,
    showCustomInput,
    effectiveLang,
    languageOptions,
    handleLanguageSelect,
    handleCustomTextChange,
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

  const selectTooltip = 'Select a target language for this section';

  const triggerContent = (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      {isAdaptingLanguage
        ? <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
        : <Languages className="h-3 w-3 flex-shrink-0" />}
      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.15em]">
        {t.editor?.adaptation ?? 'Adaptation'}
      </span>
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
          />
        </div>
      </Tooltip>

      {showCustomInput && (
        <input
          ref={customInputRef}
          type="text"
          value={customText}
          onChange={handleCustomTextChange}
          onBlur={handleCustomConfirm}
          placeholder="e.g. Scots Gaelic, Toki Pona…"
          maxLength={80}
          className="flex-1 min-w-[10rem] max-w-[18rem] px-2 py-1 rounded text-[11px]"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--lcars-cyan, var(--border-color))',
            color: 'var(--text-primary)',
            outline: 'none',
            borderRadius: '6px 2px 6px 2px',
          }}
          aria-label="Custom adaptation language"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canAdapt) handleApply();
          }}
        />
      )}

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

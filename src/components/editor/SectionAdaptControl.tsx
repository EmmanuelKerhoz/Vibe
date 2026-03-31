import React, { useCallback } from 'react';
import { Loader2, Languages } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { LcarsSelect } from '../ui/LcarsSelect';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES } from '../../i18n';

// Built once at module level — stable reference across renders
const SECTION_LANGUAGE_OPTIONS = SUPPORTED_ADAPTATION_LANGUAGES.map(lang => ({
  value: lang.aiName,
  label: (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      <EmojiSign sign={lang.sign} />
      <span className="truncate text-[11px]">
        {lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}
      </span>
    </span>
  ) as React.ReactNode,
}));

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
  const canAdapt = !!adaptSectionLanguage && hasApiKey && !isGenerating && !isAnalyzing && !isAdaptingLanguage;

  const handleLanguageSelect = useCallback((lang: string) => {
    onSectionTargetLanguageChange?.(sectionId, lang);
    if (canAdapt) {
      adaptSectionLanguage!(sectionId, lang);
    }
  }, [sectionId, canAdapt, onSectionTargetLanguageChange, adaptSectionLanguage]);

  if (!adaptSectionLanguage) return null;

  const tooltipTitle = hasApiKey
    ? 'Select a target language to adapt this section'
    : (t.tooltips.aiUnavailable ?? 'AI unavailable');

  const triggerContent = (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      {isAdaptingLanguage
        ? <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
        : <Languages className="h-3 w-3 flex-shrink-0" />}
      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.15em]">
        {t.editor.adaptation ?? 'Adaptation'}
      </span>
    </span>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tooltip title={tooltipTitle}>
        <div className="min-w-[13rem] max-w-[18rem] flex-shrink-0">
          <LcarsSelect
            value={sectionTargetLanguage}
            onChange={handleLanguageSelect}
            options={SECTION_LANGUAGE_OPTIONS}
            accentColor="var(--lcars-cyan)"
            triggerLabel={triggerContent}
            disabled={!canAdapt}
          />
        </div>
      </Tooltip>
    </div>
  );
});

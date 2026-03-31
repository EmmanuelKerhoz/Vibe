import React from 'react';
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

  if (!adaptSectionLanguage) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="min-w-[13rem] max-w-[18rem] flex-shrink-0">
          <LcarsSelect
            value={sectionTargetLanguage}
            onChange={(v) => onSectionTargetLanguageChange?.(sectionId, v)}
            options={SECTION_LANGUAGE_OPTIONS}
            accentColor="var(--lcars-cyan)"
          />
        </div>
        <Tooltip title={hasApiKey ? `Adapt this section to ${sectionTargetLanguage}` : (t.tooltips.aiUnavailable ?? 'AI unavailable')}>
          <button
            onClick={() => adaptSectionLanguage(sectionId, sectionTargetLanguage)}
            disabled={!canAdapt}
            className="flex items-center gap-1.5 rounded border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdaptingLanguage
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Languages className="h-3 w-3" />}
            {t.editor.adapt ?? 'ADAPT'}
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

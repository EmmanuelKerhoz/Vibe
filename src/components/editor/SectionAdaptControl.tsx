import React, { useCallback, useMemo, useState } from 'react';
import { Loader2, Languages, Check } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { LcarsSelect } from '../ui/LcarsSelect';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES } from '../../i18n';

// ─── Language grouping ────────────────────────────────────────────────────────

type LangGroup = {
  label: string;
  codes: string[];
};

const LANGUAGE_GROUPS: LangGroup[] = [
  { label: 'Romance',        codes: ['AR_ROM', 'ES', 'FR', 'IT', 'PT', 'RO', 'CA'] },
  { label: 'Germanic',       codes: ['EN', 'DE', 'NL', 'SV', 'DA', 'NO', 'IS'] },
  { label: 'Slavic',         codes: ['RU', 'PL', 'CS', 'SK', 'UK', 'BG', 'SR', 'HR'] },
  { label: 'Semitic',        codes: ['AR', 'HE', 'AM'] },
  { label: 'South & SE Asian', codes: ['HI', 'UR', 'BN', 'PA', 'FA', 'TA', 'TE', 'KN', 'ML', 'TH', 'LO', 'VI', 'KM', 'ID', 'MS', 'TL'] },
  { label: 'CJK & Altaic',   codes: ['ZH', 'YUE', 'JA', 'KO', 'JV', 'TR', 'AZ', 'UZ', 'KK', 'FI', 'HU', 'ET'] },
  { label: 'African',        codes: ['SW', 'YO', 'HA', 'FF', 'BM', 'BA', 'DI', 'EW', 'MI', 'LN', 'ZU', 'WO', 'BK', 'CB', 'OG'] },
  { label: 'Creole & Other', codes: ['NOU', 'PCM', 'CFG', 'MG', 'IS_ETC'] },
];

// Build a code → group label index for fast lookup
const CODE_TO_GROUP = new Map<string, string>();
for (const g of LANGUAGE_GROUPS) {
  for (const c of g.codes) CODE_TO_GROUP.set(c, g.label);
}

function getGroupLabel(code: string): string {
  return CODE_TO_GROUP.get(code.toUpperCase()) ?? 'Other';
}

// ─── Options (built once at module level) ─────────────────────────────────────

const SECTION_LANGUAGE_OPTIONS = (() => {
  // Group → array of options
  const grouped = new Map<string, { value: string; label: React.ReactNode }[]>();

  for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
    const group = getGroupLabel(lang.code);
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push({
      value: lang.aiName,
      label: (
        <span className="flex items-center gap-1.5 min-w-0 w-full">
          <EmojiSign sign={lang.sign} />
          <span className="truncate text-[11px]">
            {lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}
          </span>
        </span>
      ) as React.ReactNode,
    });
  }

  // Flatten with group headers as disabled separators
  const result: { value: string; label: React.ReactNode; disabled?: boolean; isGroupHeader?: boolean }[] = [];
  for (const [groupLabel, items] of grouped.entries()) {
    result.push({
      value: `__group__${groupLabel}`,
      label: (
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 select-none">
          {groupLabel}
        </span>
      ) as React.ReactNode,
      disabled: true,
      isGroupHeader: true,
    });
    result.push(...items);
  }
  return result;
})();

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Pending selection: updated immediately on dropdown change, applied on confirm
  const [pendingLang, setPendingLang] = useState<string>(sectionTargetLanguage);

  const canAdapt = !!adaptSectionLanguage && hasApiKey && !isGenerating && !isAnalyzing && !isAdaptingLanguage;
  const isDirty = pendingLang !== sectionTargetLanguage;

  // Selection change: update pending + notify parent (preview only, no adaptation)
  const handleLanguageSelect = useCallback((lang: string) => {
    if (lang.startsWith('__group__')) return; // skip group headers
    setPendingLang(lang);
    onSectionTargetLanguageChange?.(sectionId, lang);
  }, [sectionId, onSectionTargetLanguageChange]);

  // Apply: triggers the actual AI adaptation
  const handleApply = useCallback(() => {
    if (!canAdapt) return;
    adaptSectionLanguage!(sectionId, pendingLang);
  }, [canAdapt, adaptSectionLanguage, sectionId, pendingLang]);

  if (!adaptSectionLanguage) return null;

  const applyTooltip = !hasApiKey
    ? (t.tooltips?.aiUnavailable ?? 'AI unavailable — configure an API key')
    : isDirty
      ? `Adapt this section to ${pendingLang}`
      : `Section already set to ${pendingLang}`;

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
      {/* Language selector — always navigable, never fully disabled */}
      <Tooltip title={selectTooltip}>
        <div className="min-w-[13rem] max-w-[18rem] flex-shrink-0">
          <LcarsSelect
            value={pendingLang}
            onChange={handleLanguageSelect}
            options={SECTION_LANGUAGE_OPTIONS}
            accentColor="var(--lcars-cyan)"
            triggerLabel={triggerContent}
            disabled={false}
          />
        </div>
      </Tooltip>

      {/* Apply button — disabled without API key or while busy */}
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

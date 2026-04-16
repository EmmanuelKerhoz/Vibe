import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Loader2, Languages, Check } from '../ui/icons';
import { Tooltip } from '../ui/Tooltip';
import { LcarsSelect } from '../ui/LcarsSelect';
import { EmojiSign } from '../ui/EmojiSign';
import { useTranslation } from '../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES, CUSTOM_LANGUAGE_VALUE, isCustomAdaptationLanguage } from '../../i18n';

// ─── Language grouping ────────────────────────────────────────────────────────

type LangGroup = {
  label: string;
  codes: string[];
};

const LANGUAGE_GROUPS: LangGroup[] = [
  { label: 'Romance',          codes: ['AR_ROM', 'ES', 'FR', 'IT', 'PT', 'RO', 'CA'] },
  { label: 'Germanic',         codes: ['EN', 'DE', 'NL', 'SV', 'DA', 'NO', 'IS'] },
  { label: 'Slavic',           codes: ['RU', 'PL', 'CS', 'SK', 'UK', 'BG', 'SR', 'HR'] },
  { label: 'Semitic',          codes: ['AR', 'HE', 'AM'] },
  { label: 'South & SE Asian', codes: ['HI', 'UR', 'BN', 'PA', 'FA', 'TA', 'TE', 'KN', 'ML', 'TH', 'LO', 'VI', 'KM', 'ID', 'MS', 'TL'] },
  { label: 'CJK & Altaic',     codes: ['ZH', 'YUE', 'JA', 'KO', 'JV', 'TR', 'AZ', 'UZ', 'KK', 'FI', 'HU', 'ET'] },
  { label: 'African',          codes: ['SW', 'YO', 'HA', 'FF', 'BM', 'BA', 'DI', 'EW', 'MI', 'LN', 'ZU', 'WO', 'BK', 'CB', 'OG'] },
  { label: 'Creole & Other',   codes: ['NOU', 'PCM', 'CFG', 'MG', 'IS_ETC'] },
];

const CODE_TO_GROUP = new Map<string, string>();
for (const g of LANGUAGE_GROUPS) {
  for (const c of g.codes) CODE_TO_GROUP.set(c, g.label);
}

function getGroupLabel(code: string): string {
  return CODE_TO_GROUP.get(code.toUpperCase()) ?? 'Other';
}

// ─── Helper: build grouped options ───────────────────────────────────────────

function buildLanguageOptions() {
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

  const result: { value: string; label: React.ReactNode; disabled?: boolean }[] = [];
  for (const [groupLabel, items] of grouped.entries()) {
    result.push({
      value: `__group__${groupLabel}`,
      label: (
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 select-none">
          {groupLabel}
        </span>
      ) as React.ReactNode,
      disabled: true,
    });
    result.push(...items);
  }

  // ── Free-text sentinel entry (always last) ─────────────────────────────────
  result.push(
    {
      value: '__group__other_lang',
      label: (
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 select-none">
          Free input
        </span>
      ) as React.ReactNode,
      disabled: true,
    },
    {
      value: CUSTOM_LANGUAGE_VALUE,
      label: (
        <span className="flex items-center gap-1.5 min-w-0 w-full">
          <span style={{ fontSize: '0.95em' }}>✏️</span>
          <span className="truncate text-[11px]">Other language…</span>
        </span>
      ) as React.ReactNode,
    },
  );

  return result;
}

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

  const languageOptions = useMemo(() => buildLanguageOptions(), []);

  // Determine if the stored value is the custom sentinel or a typed custom string
  // (a previously-saved free-text value is not in the list → also treated as custom).
  const isStoredCustom =
    isCustomAdaptationLanguage(sectionTargetLanguage) ||
    (!SUPPORTED_ADAPTATION_LANGUAGES.some(l => l.aiName === sectionTargetLanguage) &&
      sectionTargetLanguage !== '');

  const [selectValue, setSelectValue] = useState<string>(
    isStoredCustom ? CUSTOM_LANGUAGE_VALUE : sectionTargetLanguage,
  );
  const [customText, setCustomText] = useState<string>(
    isStoredCustom ? sectionTargetLanguage : '',
  );
  const customInputRef = useRef<HTMLInputElement>(null);

  const showCustomInput = isCustomAdaptationLanguage(selectValue);

  // The effective language name sent to the AI.
  const effectiveLang = showCustomInput ? customText.trim() : selectValue;

  const canAdapt =
    !!adaptSectionLanguage &&
    hasApiKey &&
    !isGenerating &&
    !isAnalyzing &&
    !isAdaptingLanguage &&
    effectiveLang.length > 0;

  const isDirty = effectiveLang !== sectionTargetLanguage && effectiveLang.length > 0;

  const handleLanguageSelect = useCallback(
    (lang: string) => {
      if (lang.startsWith('__group__')) return;
      setSelectValue(lang);
      if (!isCustomAdaptationLanguage(lang)) {
        onSectionTargetLanguageChange?.(sectionId, lang);
      } else {
        // Focus the input on next tick
        setTimeout(() => customInputRef.current?.focus(), 50);
      }
    },
    [sectionId, onSectionTargetLanguageChange],
  );

  const handleCustomTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomText(val);
      if (val.trim()) {
        onSectionTargetLanguageChange?.(sectionId, val.trim());
      }
    },
    [sectionId, onSectionTargetLanguageChange],
  );

  const handleApply = useCallback(() => {
    if (!canAdapt) return;
    adaptSectionLanguage!(sectionId, effectiveLang);
  }, [canAdapt, adaptSectionLanguage, sectionId, effectiveLang]);

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

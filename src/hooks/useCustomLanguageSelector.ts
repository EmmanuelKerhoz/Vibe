import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  SUPPORTED_ADAPTATION_LANGUAGES,
  CUSTOM_LANGUAGE_VALUE,
  isCustomAdaptationLanguage,
} from '../i18n';
import { EmojiSign } from '../components/ui/EmojiSign';

// ─── Language grouping ────────────────────────────────────────────────────────

type LangGroup = { label: string; codes: string[] };

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

export interface GroupedLanguageOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  /** When true, the option is shown even when a search filter is active. */
  alwaysShow?: boolean;
  /** Plain-text representation used for live filtering in searchable selects. */
  searchText?: string;
}

export function buildGroupedLanguageOptions(): GroupedLanguageOption[] {
  const grouped = new Map<string, GroupedLanguageOption[]>();

  for (const lang of SUPPORTED_ADAPTATION_LANGUAGES) {
    const group = getGroupLabel(lang.code);
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push({
      value: lang.aiName,
      label: (
        React.createElement('span', { className: 'flex items-center gap-1.5 min-w-0 w-full' },
          React.createElement(EmojiSign, { sign: lang.sign }),
          React.createElement('span', { className: 'truncate text-[11px]' },
            lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName
          )
        )
      ) as React.ReactNode,
      searchText: lang.aiName,
    });
  }

  const result: GroupedLanguageOption[] = [];

  // "Free input" entry sits at the very top so users can immediately access the
  // custom-language slot or type a value into the searchable dropdown filter.
  result.push(
    {
      value: '__group__other_lang',
      label: React.createElement('span', {
        className: 'text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 select-none'
      }, 'Free input') as React.ReactNode,
      disabled: true,
      alwaysShow: true,
    },
    {
      value: CUSTOM_LANGUAGE_VALUE,
      label: (
        React.createElement('span', { className: 'flex items-center gap-1.5 min-w-0 w-full' },
          React.createElement('span', { style: { fontSize: '0.95em' } }, '✏️'),
          React.createElement('span', { className: 'truncate text-[11px]' }, 'Other language…')
        )
      ) as React.ReactNode,
      alwaysShow: true,
      searchText: 'Other language',
    },
  );

  for (const [groupLabel, items] of grouped.entries()) {
    result.push({
      value: `__group__${groupLabel}`,
      label: (
        React.createElement('span', {
          className: 'text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 select-none'
        }, groupLabel)
      ) as React.ReactNode,
      disabled: true,
    });
    result.push(...items);
  }

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseCustomLanguageSelectorOptions {
  storedValue: string;
  onValueChange: (lang: string) => void;
}

export interface UseCustomLanguageSelectorResult {
  selectValue: string;
  customText: string;
  customInputRef: React.RefObject<HTMLInputElement>;
  showCustomInput: boolean;
  effectiveLang: string;
  languageOptions: ReturnType<typeof buildGroupedLanguageOptions>;
  handleLanguageSelect: (lang: string) => void;
  handleCustomTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Imperatively set the custom text (e.g. wired from a searchable dropdown). */
  setCustomText: (value: string) => void;
  /** Call on Enter / blur / Apply button to commit the custom text. */
  handleCustomConfirm: () => void;
}

export function useCustomLanguageSelector({
  storedValue,
  onValueChange,
}: UseCustomLanguageSelectorOptions): UseCustomLanguageSelectorResult {
  const isStoredCustom =
    isCustomAdaptationLanguage(storedValue) ||
    (!SUPPORTED_ADAPTATION_LANGUAGES.some(l => l.aiName === storedValue) &&
      storedValue !== '');

  const [selectValue, setSelectValue] = useState<string>(
    isStoredCustom ? CUSTOM_LANGUAGE_VALUE : storedValue,
  );
  const [customText, setCustomText] = useState<string>(
    isStoredCustom ? storedValue : '',
  );
  const customInputRef = useRef<HTMLInputElement>(null);

  const showCustomInput = isCustomAdaptationLanguage(selectValue);
  const effectiveLang = showCustomInput ? customText.trim() : selectValue;

  const languageOptions = useMemo(() => buildGroupedLanguageOptions(), []);

  const handleLanguageSelect = useCallback(
    (lang: string) => {
      if (lang.startsWith('__group__')) return;
      setSelectValue(lang);
      if (!isCustomAdaptationLanguage(lang)) {
        // Picking a real language clears any pending custom text so the search
        // box doesn't keep stale input next time the user opens the dropdown.
        setCustomText('');
        onValueChange(lang);
      } else {
        requestAnimationFrame(() => customInputRef.current?.focus());
      }
    },
    [onValueChange],
  );

  // Updates local state only — does NOT call onValueChange on every keystroke.
  const handleCustomTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomText(e.target.value);
    },
    [],
  );

  // Commits the current customText to onValueChange (Enter / blur / Apply).
  const handleCustomConfirm = useCallback(() => {
    const trimmed = customText.trim();
    if (trimmed) onValueChange(trimmed);
  }, [customText, onValueChange]);

  return {
    selectValue,
    customText,
    customInputRef,
    showCustomInput,
    effectiveLang,
    languageOptions,
    handleLanguageSelect,
    handleCustomTextChange,
    setCustomText,
    handleCustomConfirm,
  };
}

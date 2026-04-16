import { useCallback, useMemo, useRef, useState } from 'react';
import { Loader2, Languages } from '../../ui/icons';
import { LcarsSelect } from '../../ui/LcarsSelect';
import { Tooltip } from '../../ui/Tooltip';
import { EmojiSign } from '../../ui/EmojiSign';
import { useTranslation } from '../../../i18n';
import {
  SUPPORTED_ADAPTATION_LANGUAGES,
  CUSTOM_LANGUAGE_VALUE,
  isCustomAdaptationLanguage,
} from '../../../i18n';
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
  const tooltipTitle = !hasApiKey
    ? (t.tooltips.aiUnavailable ?? 'AI unavailable')
    : 'Select a target language to adapt the entire song';

  // Detect custom stored value (sentinel or previously-saved free text)
  const isStoredCustom =
    isCustomAdaptationLanguage(targetLanguage) ||
    (!SUPPORTED_ADAPTATION_LANGUAGES.some(l => l.aiName === targetLanguage) &&
      targetLanguage !== '');

  const [selectValue, setSelectValue] = useState<string>(
    isStoredCustom ? CUSTOM_LANGUAGE_VALUE : targetLanguage,
  );
  const [customText, setCustomText] = useState<string>(
    isStoredCustom ? targetLanguage : '',
  );
  const customInputRef = useRef<HTMLInputElement>(null);

  const showCustomInput = isCustomAdaptationLanguage(selectValue);
  const effectiveLang = showCustomInput ? customText.trim() : selectValue;

  const languageOptions = useMemo(() => [
    ...SUPPORTED_ADAPTATION_LANGUAGES.map(lang => ({
      value: lang.aiName,
      label: (
        <span className="flex items-center gap-1.5 min-w-0 w-full">
          <EmojiSign sign={lang.sign} />
          <span className="truncate">{lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}</span>
        </span>
      ),
    })),
    // separator
    {
      value: '__group__free_input',
      label: (
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 select-none">
          Free input
        </span>
      ),
      disabled: true,
    },
    {
      value: CUSTOM_LANGUAGE_VALUE,
      label: (
        <span className="flex items-center gap-1.5 min-w-0 w-full">
          <span style={{ fontSize: '0.95em' }}>✏️</span>
          <span className="truncate">Other language…</span>
        </span>
      ),
    },
  ], []);

  const handleLanguageSelect = useCallback((lang: string) => {
    if (lang.startsWith('__group__')) return;
    setSelectValue(lang);
    if (!isCustomAdaptationLanguage(lang)) {
      setTargetLanguage(lang);
      if (!isBaseDisabled) adaptSongLanguage(lang);
    } else {
      setTimeout(() => customInputRef.current?.focus(), 50);
    }
  }, [setTargetLanguage, isBaseDisabled, adaptSongLanguage]);

  const handleCustomTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomText(val);
      if (val.trim()) setTargetLanguage(val.trim());
    },
    [setTargetLanguage],
  );

  const handleCustomSubmit = useCallback(() => {
    const lang = effectiveLang;
    if (!lang || isBaseDisabled) return;
    adaptSongLanguage(lang);
  }, [effectiveLang, isBaseDisabled, adaptSongLanguage]);

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

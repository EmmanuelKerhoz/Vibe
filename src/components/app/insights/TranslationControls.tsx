import { Loader2, Languages } from '../../ui/icons';
import { LcarsSelect } from '../../ui/LcarsSelect';
import { Tooltip } from '../../ui/Tooltip';
import { EmojiSign } from '../../ui/EmojiSign';
import { useTranslation } from '../../../i18n';
import { SUPPORTED_ADAPTATION_LANGUAGES, getLanguageDisplay } from '../../../i18n';

interface TranslationControlsProps {
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  isAdaptingLanguage: boolean;
  songCount: number;
  adaptSongLanguage: (lang: string) => void;
  showTranslationFeatures: boolean;
}

const LANGUAGE_SELECT_OPTIONS = SUPPORTED_ADAPTATION_LANGUAGES.map(lang => ({
  value: lang.aiName,
  label: (
    <span className="flex items-center gap-1.5 min-w-0 w-full">
      <EmojiSign sign={lang.sign} />
      <span className="truncate">{lang.region ? `${lang.aiName} (${lang.region})` : lang.aiName}</span>
    </span>
  ),
}));

export function TranslationControls({
  targetLanguage,
  setTargetLanguage,
  isAdaptingLanguage,
  songCount,
  adaptSongLanguage,
  showTranslationFeatures,
}: TranslationControlsProps) {
  const { t } = useTranslation();
  const targetDisplay = getLanguageDisplay(targetLanguage);
  const targetLanguageDisplayText = targetDisplay ? `${targetDisplay.sign} ${targetDisplay.label}` : targetLanguage;

  if (!showTranslationFeatures) {
    return null;
  }

  return (
    <>
      <Tooltip title={t.tooltips.adaptSong.replaceAll('{lang}', targetLanguageDisplayText)}>
        <button
          onClick={() => adaptSongLanguage(targetLanguage)}
          disabled={isAdaptingLanguage || songCount === 0}
          aria-disabled={isAdaptingLanguage || songCount === 0}
          aria-busy={isAdaptingLanguage}
          className="ux-interactive px-3 py-1 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 text-[var(--accent-color)] text-[10px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {isAdaptingLanguage
            ? (<>
                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                <span className="sr-only">{t.editor.adaptingLabel ?? 'Adapting…'}</span>
              </>)
            : <Languages className="w-3 h-3" aria-hidden="true" />}
          <span className="hidden sm:inline">{t.editor.adaptation}</span>
        </button>
      </Tooltip>

      <div className="min-w-0 overflow-hidden" style={{ maxWidth: '180px' }}>
        <LcarsSelect
          value={targetLanguage}
          onChange={setTargetLanguage}
          options={LANGUAGE_SELECT_OPTIONS}
        />
      </div>
    </>
  );
}

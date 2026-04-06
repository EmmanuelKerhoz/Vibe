import { Loader2, ScanText } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { EmojiSign } from '../../ui/EmojiSign';
import { getLanguageDisplay, useTranslation } from '../../../i18n';

type LanguageDisplay = ReturnType<typeof getLanguageDisplay>;

interface DetectLanguageButtonProps {
  detectedDisplays: LanguageDisplay[];
  hasLyrics: boolean;
  isDetectingLanguage: boolean;
  hasApiKey: boolean;
  onDetect: () => void;
}

export function DetectLanguageButton({
  detectedDisplays,
  hasLyrics,
  isDetectingLanguage,
  hasApiKey,
  onDetect,
}: DetectLanguageButtonProps) {
  const { t } = useTranslation();
  const detectedLanguageList = detectedDisplays.slice(0, 3).map(d => `${d.sign} ${d.label}`).join(', ');
  const isDisabled = !hasApiKey || isDetectingLanguage || !hasLyrics;
  const tooltipTitle = !hasApiKey
    ? (t.tooltips.aiUnavailable ?? 'AI unavailable')
    : detectedDisplays.length > 0
      ? (t.tooltips.redetectLanguage ?? 'Detected: {langs} — click to re-detect').replace('{langs}', detectedLanguageList)
      : (t.tooltips.detectLanguage ?? 'Detect song language');

  return (
    <Tooltip title={tooltipTitle}>
      <button
        onClick={() => void onDetect()}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isDetectingLanguage}
        className="ux-interactive px-2.5 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-[11px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 border border-black/10 dark:border-white/10 whitespace-nowrap shrink-0"
      >
        {isDetectingLanguage
          ? (<>
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              <span className="sr-only">{t.editor.detectingLanguageLabel ?? 'Detecting language…'}</span>
            </>)
          : <ScanText className="w-3 h-3" aria-hidden="true" />}
        {detectedDisplays.length > 0
          ? <><EmojiSign sign={detectedDisplays[0]!.sign} /><span className="hidden sm:inline">{detectedDisplays[0]!.label}</span></>
          : <><EmojiSign sign="🌐" /><span className="hidden sm:inline">{t.editor.detect ?? 'Detect'}</span></>}
      </button>
    </Tooltip>
  );
}

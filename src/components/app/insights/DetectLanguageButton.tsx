import { Loader2, ScanText } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { EmojiSign } from '../../ui/EmojiSign';
import { useTranslation, getLanguageDisplay } from '../../../i18n';

interface DetectLanguageButtonProps {
  detectedLanguages: string[];
  songLanguage?: string;
  songCount: number;
  isDetectingLanguage: boolean;
  onDetect: () => void;
}

export function DetectLanguageButton({
  detectedLanguages,
  songLanguage,
  songCount,
  isDetectingLanguage,
  onDetect,
}: DetectLanguageButtonProps) {
  const { t } = useTranslation();
  const detectedDisplays = (detectedLanguages.length > 0 ? detectedLanguages : (songLanguage ? [songLanguage] : []))
    .map(lang => getLanguageDisplay(lang));
  const detectedLanguageList = detectedDisplays.slice(0, 3).map(d => `${d.sign} ${d.label}`).join(', ');

  return (
    <Tooltip
      title={detectedDisplays.length > 0
        ? (t.tooltips.redetectLanguage ?? 'Detected: {langs} — click to re-detect').replace('{langs}', detectedLanguageList)
        : (t.tooltips.detectLanguage ?? 'Detect song language')}
    >
      <button
        onClick={() => void onDetect()}
        disabled={isDetectingLanguage || songCount === 0}
        aria-disabled={isDetectingLanguage || songCount === 0}
        aria-busy={isDetectingLanguage}
        className="ux-interactive px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold rounded flex items-center gap-1.5 disabled:opacity-50 border border-white/10 whitespace-nowrap shrink-0"
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

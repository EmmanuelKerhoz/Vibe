import { Loader2, ScanText } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';

interface AnalyzeSongButtonProps {
  isGenerating: boolean;
  isAnalyzing: boolean;
  hasLyrics: boolean;
  hasApiKey: boolean;
  onAnalyze: () => void;
}

export function AnalyzeSongButton({
  isGenerating,
  isAnalyzing,
  hasLyrics,
  hasApiKey,
  onAnalyze,
}: AnalyzeSongButtonProps) {
  const { t } = useTranslation();
  const isDisabled = !hasApiKey || isGenerating || isAnalyzing || !hasLyrics;
  const tooltipTitle = !hasApiKey
    ? (t.tooltips.aiUnavailable ?? 'AI unavailable')
    : t.tooltips.analyzeTheme;

  return (
    <Tooltip title={tooltipTitle}>
      <button
        onClick={onAnalyze}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isAnalyzing}
        className="px-2 lg:px-3 py-1 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing
          ? (<>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span className="sr-only">{t.editor.analyzingLabel ?? 'Analyzing…'}</span>
            </>)
          : <ScanText className="w-3.5 h-3.5" aria-hidden="true" />}
        <span className="hidden lg:inline">Analysis</span>
      </button>
    </Tooltip>
  );
}

import { Loader2, BarChart2 } from '../../ui/icons';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';

interface AnalyzeSongButtonProps {
  isGenerating: boolean;
  isAnalyzing: boolean;
  hasLyrics: boolean;
  onAnalyze: () => void;
}

export function AnalyzeSongButton({
  isGenerating,
  isAnalyzing,
  hasLyrics,
  onAnalyze,
}: AnalyzeSongButtonProps) {
  const { t } = useTranslation();

  return (
    <Tooltip title={t.tooltips.analyzeTheme}>
      <button
        onClick={onAnalyze}
        disabled={isGenerating || isAnalyzing || !hasLyrics}
        aria-disabled={isGenerating || isAnalyzing || !hasLyrics}
        aria-busy={isAnalyzing}
        className="px-2 lg:px-3 py-1 glass-button text-[11px] rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing
          ? (<>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span className="sr-only">{t.editor.analyzingLabel ?? 'Analyzing…'}</span>
            </>)
          : <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />}
        <span className="hidden lg:inline">{t.editor.analyze}</span>
      </button>
    </Tooltip>
  );
}

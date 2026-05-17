import { useTranslation } from '../../../i18n';
import { useAppKpis } from '../../../hooks/useAppKpis';
import type { Translations } from '../../../i18n/locales/types';

type InsightsStrings = Required<Translations>['insights'];

const FALLBACK_INSIGHTS: InsightsStrings = {
  title: '',
  sections: '',
  words: '',
  characters: '',
};

export function MobileKpis() {
  const { t } = useTranslation();
  const { sectionCount, wordCount, charCount } = useAppKpis();
  const insights: InsightsStrings = t.insights ?? FALLBACK_INSIGHTS;

  return (
    <div className="flex lg:hidden items-center gap-3 shrink-0">
      <div className="flex flex-col items-end">
        <span className="micro-label text-zinc-600 dark:text-zinc-500">{insights.sections}</span>
        <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{sectionCount}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="micro-label text-zinc-600 dark:text-zinc-500">{insights.words}</span>
        <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{wordCount}</span>
      </div>
      <div className="hidden sm:flex lg:hidden flex-col items-end">
        <span className="micro-label text-zinc-600 dark:text-zinc-500">{insights.characters}</span>
        <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{charCount}</span>
      </div>
    </div>
  );
}

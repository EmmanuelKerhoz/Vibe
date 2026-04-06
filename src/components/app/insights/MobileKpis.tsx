import { useTranslation } from '../../../i18n';
import { useAppKpis } from '../../../hooks/useAppKpis';

export function MobileKpis() {
  const { t } = useTranslation();
  const { sectionCount, wordCount, charCount } = useAppKpis();

  return (
    <div className="flex lg:hidden items-center gap-3 shrink-0">
      <div className="flex flex-col items-end">
        <span className="micro-label text-zinc-600 dark:text-zinc-500">{t.insights.sections}</span>
        <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{sectionCount}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="micro-label text-zinc-600 dark:text-zinc-500">{t.insights.words}</span>
        <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{wordCount}</span>
      </div>
      <div className="hidden sm:flex lg:hidden flex-col items-end">
        <span className="micro-label text-zinc-600 dark:text-zinc-500">{t.insights.characters}</span>
        <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{charCount}</span>
      </div>
    </div>
  );
}

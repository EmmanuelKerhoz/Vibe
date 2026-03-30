import type { ReactNode } from 'react';
import { BarChart2 } from '../../ui/icons';
import { useTranslation } from '../../../i18n';

interface InsightsBarLayoutProps {
  viewSelector: ReactNode;
  translationControls: ReactNode;
  metronomeControl: ReactNode;
  insightsActions: ReactNode;
  mobileKpis: ReactNode;
  banner: ReactNode;
}

export function InsightsBarLayout({
  viewSelector,
  translationControls,
  metronomeControl,
  insightsActions,
  mobileKpis,
  banner,
}: InsightsBarLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="insights-bar-mobile border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-3 lg:px-4 py-2 z-10" style={{ position: 'relative', overflow: 'visible' }}>
      <div
        style={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
          opacity: 0.85,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
      <div className="flex flex-col gap-2 lg:gap-3 w-full">
        <div className="flex items-center gap-2 min-w-0">
          {viewSelector}
          <div className="hidden lg:block h-4 w-px bg-[var(--border-color)] shrink-0" />
          <h3 className="micro-label text-[var(--text-secondary)] hidden lg:flex items-center gap-2 shrink-0 whitespace-nowrap">
            <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
            {t.insights.title}
          </h3>
          <div className="hidden lg:block h-4 w-px bg-[var(--border-color)] shrink-0" />
          {translationControls}
          {metronomeControl}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <span className="hidden lg:inline micro-label text-zinc-500 whitespace-nowrap mr-0.5">{t.editor.lyricsInsights ?? 'INSIGHTS'}</span>
            {insightsActions}
          </div>
          {mobileKpis}
        </div>
        {banner}
      </div>
    </div>
  );
}

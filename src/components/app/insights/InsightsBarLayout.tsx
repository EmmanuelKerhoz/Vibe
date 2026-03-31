import type { ReactNode } from 'react';

interface InsightsBarLayoutProps {
  viewSelector: ReactNode;
  detectControl?: ReactNode;
  translationControls: ReactNode;
  metronomeControl: ReactNode;
  insightsActions: ReactNode;
  mobileKpis: ReactNode;
  banner: ReactNode;
}

export function InsightsBarLayout({
  viewSelector,
  detectControl,
  translationControls,
  metronomeControl,
  insightsActions,
  mobileKpis,
  banner,
}: InsightsBarLayoutProps) {
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
          {detectControl}
          {translationControls}
          {metronomeControl}
          {insightsActions}
          {mobileKpis}
        </div>
        {banner}
      </div>
    </div>
  );
}

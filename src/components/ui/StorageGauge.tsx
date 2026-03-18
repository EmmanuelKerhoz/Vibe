import React, { useState, useRef, useEffect } from 'react';
import { HardDrive } from 'lucide-react';
import { useStorageEstimate } from '../../hooks/useStorageEstimate';
import type { StorageTier } from '../../hooks/useStorageEstimate';

const TIER_COLOR: Record<StorageTier, string> = {
  green:  'var(--accent-color)',
  orange: 'var(--accent-warning, #f59e0b)',
  red:    'var(--accent-error,   #ef4444)',
};

const TIER_BG: Record<StorageTier, string> = {
  green:  'var(--accent-color)',
  orange: 'var(--accent-warning, #f59e0b)',
  red:    'var(--accent-error,   #ef4444)',
};

/** Small gauge widget for the StatusBar. */
export function StorageGauge() {
  const est = useStorageEstimate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!est.supported) return null;

  const color = TIER_COLOR[est.tier];
  const pct = Math.round(est.ratio * 100);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        aria-label={`Storage: ${pct}% used`}
        onClick={() => setOpen(v => !v)}
        className="lcars-meta-btn min-h-[44px] lg:min-h-0 flex items-center gap-1"
      >
        {/* Layered icon: outline + fill clip */}
        <span className="relative w-3.5 h-3.5 flex-shrink-0">
          <HardDrive className="absolute inset-0 w-full h-full" style={{ color }} />
          {/* fill bar — bottom-up */}
          <span
            className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-sm"
            style={{
              height: `${pct}%`,
              background: TIER_BG[est.tier],
              opacity: 0.35,
              transition: 'height 0.6s ease',
            }}
          />
        </span>
        <span className="hidden sm:inline telemetry-text" style={{ color }}>
          {pct}%
        </span>
      </button>

      {/* Mini popover */}
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 z-50 w-56 glass-panel border border-[var(--border-color)] rounded-[12px_4px_12px_4px] shadow-xl p-3 text-[11px]"
          role="tooltip"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
            Browser Storage
          </p>
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-[var(--bg-app)] overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Used</span>
            <span style={{ color }} className="font-semibold">{est.usageMB}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)] mt-0.5">
            <span>Quota</span>
            <span className="font-semibold text-[var(--text-primary)]">{est.quotaMB}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)] mt-0.5">
            <span>Saturation</span>
            <span style={{ color }} className="font-bold">{pct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

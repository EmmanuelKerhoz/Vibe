import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [coords, setCoords] = useState<{ bottom: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setCoords({
        bottom: window.innerHeight - r.top + 8,
        right:  window.innerWidth  - r.right,
      });
    }
  }, []);

  const handleMouseEnter = () => {
    updateCoords();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updateCoords();
    window.addEventListener('resize', onScroll, { passive: true });
    return () => window.removeEventListener('resize', onScroll);
  }, [open, updateCoords]);

  if (!est.supported) return null;

  const color = TIER_COLOR[est.tier];
  const pct = Math.round(est.ratio * 100);

  const popover = open && coords ? createPortal(
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{
        position: 'fixed',
        bottom: coords.bottom,
        right:  coords.right,
        zIndex: 9999,
        width: '224px',
      }}
    >
      <div
        className="w-full rounded-[12px_4px_12px_4px] shadow-xl p-3 text-[11px]"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
          position: 'relative',
        }}
        role="tooltip"
      >
        {/* Gradient border */}
        <div
          className="absolute inset-0 rounded-[12px_4px_12px_4px] pointer-events-none"
          style={{
            background: 'var(--accent-rail-gradient-h)',
            zIndex: -1,
            margin: '-2px',
          }}
        />
        {/* Inner content */}
        <div
          className="relative bg-white/98 dark:bg-black/95 rounded-[10px_2px_10px_2px] -m-3 p-3"
          style={{
            backdropFilter: 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
            Browser Storage
          </p>
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
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-label={`Storage: ${pct}% used`}
        className="lcars-meta-btn min-h-[44px] lg:min-h-0 flex items-center gap-1"
      >
        <span className="relative w-3.5 h-3.5 flex-shrink-0">
          <HardDrive className="absolute inset-0 w-full h-full" style={{ color }} />
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
      {popover}
    </div>
  );
}

import { LCARS } from './lcarsTheme';
import { BlackHoleBadge } from './PlayerWidgets';
import type { FrequencyAnalyserState } from './useFrequencyAnalyser';

// ─── LCARSBackground ─────────────────────────────────────────────────────────

export function LCARSBackground() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 20% 40%, rgba(255,153,0,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 60%, rgba(153,102,204,0.07) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(255,102,102,0.025) 0%, transparent 70%), #080808' }}>
    </div>
  );
}

// ─── VoxNovaFooter ────────────────────────────────────────────────────────────

export interface VoxNovaFooterProps {
  isPlaying: boolean;
  analyser: FrequencyAnalyserState;
  wideWidth: string;
}

/** Singularity-status LCARS badge — decorative footer element. */
export function VoxNovaFooter({ isPlaying, analyser, wideWidth }: VoxNovaFooterProps) {
  return (
    <div style={{ alignSelf: 'center', width: wideWidth, border: '1px solid rgba(100,100,200,0.25)', borderRadius: 4, padding: '10px 14px', background: 'rgba(0,0,20,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ color: 'rgba(100,150,255,0.7)', fontSize: 9, letterSpacing: 3, marginBottom: 4 }}>SINGULARITY STATUS</div>
        <div style={{ color: LCARS.subText, fontSize: 11, letterSpacing: 1 }}>{isPlaying ? 'ACCRETION ACTIVE' : 'EVENT HORIZON STABLE'}</div>
      </div>
      <BlackHoleBadge active={isPlaying} analyser={analyser} />
    </div>
  );
}

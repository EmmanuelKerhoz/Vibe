import { useEffect, useMemo, useState } from 'react';
import { LCARS } from './lcarsTheme';
import { StatusBar, ChipIcon, NetworkIcon } from './PlayerWidgets';
import { SPOTIFY_GREEN } from './playerConstants';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AudioSource = 'local' | 'spotify';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genRegistry(): string {
  const buf = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf);
  else for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function useSectorTime(): string {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let id: number | null = null;
    const tick = () => setT((performance.now() - start) / 100);
    const startInterval = () => { if (id !== null) return; id = window.setInterval(tick, 100); };
    const stopInterval = () => { if (id === null) return; window.clearInterval(id); id = null; };
    const onVisibility = () => { if (document.hidden) stopInterval(); else startInterval(); };
    if (!document.hidden) startInterval();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); stopInterval(); };
  }, []);
  const whole = Math.floor(t / 10).toString().padStart(4, '0');
  const dec = Math.floor(t % 10);
  return `${whole}.${dec}`;
}

// ─── SourceToggle ─────────────────────────────────────────────────────────────

function SourceToggle({ source, onChange }: { source: AudioSource; onChange: (s: AudioSource) => void }) {
  return (
    <div role="group" aria-label="Audio source" style={{ display: 'flex', alignItems: 'center', gap: 2,
      background: 'rgba(0,0,0,0.35)', borderRadius: 20, padding: '2px 3px',
      border: '1px solid rgba(255,255,255,0.08)' }}>
      {(['local', 'spotify'] as AudioSource[]).map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          aria-pressed={source === s}
          style={{
            background: source === s
              ? (s === 'spotify' ? `${SPOTIFY_GREEN}22` : `${LCARS.peach}22`)
              : 'transparent',
            border: source === s
              ? `1px solid ${s === 'spotify' ? SPOTIFY_GREEN : LCARS.peach}55`
              : '1px solid transparent',
            borderRadius: 16, padding: '2px 10px',
            color: source === s ? (s === 'spotify' ? SPOTIFY_GREEN : LCARS.peach) : LCARS.subText,
            fontSize: 9, letterSpacing: 2, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 150ms ease',
          }}
        >
          {s.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── VoxNovaHeader ────────────────────────────────────────────────────────────

export interface VoxNovaHeaderProps {
  audioSource: AudioSource;
  onAudioSourceChange: (s: AudioSource) => void;
  isSpotify: boolean;
  structuralIntegrity: number;
  neuralBuffer: number;
}

export function VoxNovaHeader({
  audioSource,
  onAudioSourceChange,
  isSpotify,
  structuralIntegrity,
  neuralBuffer,
}: VoxNovaHeaderProps) {
  const registry = useMemo(() => genRegistry(), []);
  const sectorTime = useSectorTime();

  return (
    <>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
        <div style={{ flex: 1, height: 36, background: LCARS.peach, color: '#000', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 12, fontWeight: 700, letterSpacing: 2, borderTopLeftRadius: 18, borderBottomLeftRadius: 18, justifyContent: 'space-between' }}>
          <span>USS VOX NOVA // REGISTRY {registry}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <SourceToggle source={audioSource} onChange={onAudioSourceChange} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: LCARS.alertRed, boxShadow: `0 0 6px ${LCARS.alertRed}` }} aria-hidden="true" />
              <span style={{ fontSize: 11 }}>IMPULSE_ONLY</span>
            </span>
            <ChipIcon /><NetworkIcon />
          </div>
        </div>
        <div style={{ width: 60, height: 36, background: LCARS.purple, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 18, borderBottomRightRadius: 18 }} aria-hidden="true" />
      </div>

      {/* Status bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 32, alignItems: 'start', padding: '4px 8px' }}>
        <StatusBar label={isSpotify ? 'SPOTIFY LINK' : 'STRUCTURAL INTEGRITY'} value={structuralIntegrity} color={isSpotify ? SPOTIFY_GREEN : LCARS.amber} />
        <StatusBar label="NEURAL BUFFER" value={neuralBuffer} color={LCARS.purple} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: LCARS.subText, fontSize: 10, letterSpacing: 2 }}>SECTOR TIME</div>
          <div style={{ color: LCARS.alertRed, fontSize: 20, fontFamily: 'monospace', letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>{sectorTime}</div>
        </div>
      </div>
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { FrequencyVisualizer } from './FrequencyVisualizer';
import { PlayerControls } from './PlayerControls';
import { PlayerSidebar } from './PlayerSidebar';
import { SidebarProvider } from './SidebarContext';
import { StatusBar, SeekBar, VolumeControl, BlackHoleBadge, ChipIcon, NetworkIcon } from './PlayerWidgets';
import { useAudioEngine } from './useAudioEngine';
import { useFrequencyAnalyser } from './useFrequencyAnalyser';
import { useLibraryContext } from '../../contexts/LibraryContext';
import { usePlayerNavigation } from './usePlayerNavigation';
import { LCARS } from './lcarsTheme';
import type { TrackInfo } from './useAudioEngine';

const LIBRARY_CAPACITY = 50;
const LCARS_BOX_COLORS = [
  'rgba(255,153,0,0.08)',
  'rgba(153,102,204,0.08)',
  'rgba(204,153,102,0.08)',
  'rgba(255,102,102,0.08)',
  'rgba(102,204,255,0.08)',
];

function genRegistry(): string {
  const buf = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf);
  else for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * useSectorTime — LCARS elapsed-time counter.
 * The interval is suspended when the document is hidden (tab backgrounded)
 * to avoid unnecessary state churn while the player is not visible.
 */
function useSectorTime(): string {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let id: ReturnType<typeof window.setInterval> | null = null;

    const tick = () => setT((performance.now() - start) / 100);

    const startInterval = () => {
      if (id !== null) return;
      id = window.setInterval(tick, 100);
    };
    const stopInterval = () => {
      if (id === null) return;
      window.clearInterval(id);
      id = null;
    };

    const onVisibility = () => {
      if (document.hidden) stopInterval();
      else startInterval();
    };

    if (!document.hidden) startInterval();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopInterval();
    };
  }, []);
  const whole = Math.floor(t / 10).toString().padStart(4, '0');
  const dec = Math.floor(t % 10);
  return `${whole}.${dec}`;
}

function LCARSBackground() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 20% 40%, rgba(255,153,0,0.04) 0%, transparent 55%), radial-gradient(ellipse at 80% 60%, rgba(153,102,204,0.05) 0%, transparent 55%), radial-gradient(ellipse at 50% 0%, rgba(100,180,255,0.03) 0%, transparent 60%)' }}>
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
        backgroundSize: '100% 4px' }} />
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,153,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,153,0,0.025) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 80%)' }} />
    </div>
  );
}

function TechSpecLine({ info, duration }: { info: TrackInfo | null; duration: number }) {
  if (!info) {
    return <span style={{ color: 'rgba(153,102,204,0.5)', fontStyle: 'italic' }}>[SIGNAL_ANALYSIS] Scanning...</span>;
  }
  const parts: Array<{ label: string; color: string }> = [];
  parts.push({ label: info.channelLabel, color: LCARS.amber });
  if (info.sampleRate) parts.push({ label: `${(info.sampleRate / 1000).toFixed(1)} kHz`, color: LCARS.purple });
  if (info.bitrateKbps) parts.push({ label: `~${info.bitrateKbps} kbps`, color: LCARS.purple });
  if (info.codec) parts.push({ label: info.codec, color: LCARS.peach });
  if (duration > 0) {
    const m = Math.floor(duration / 60);
    const s = Math.floor(duration % 60).toString().padStart(2, '0');
    parts.push({ label: `${m}:${s}`, color: LCARS.subText });
  }
  parts.push({ label: info.isVideo ? 'VIDEO+AUDIO' : 'AUDIO', color: info.isVideo ? LCARS.alertRed : LCARS.purple });
  return (
    <span>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: 'rgba(153,102,204,0.45)', margin: '0 6px' }}>│</span>}
          <span style={{ color: p.color }}>{p.label}</span>
        </span>
      ))}
    </span>
  );
}

interface VideoPlayerProps {
  src: string;
  isPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  contentWidth: string;
}

function VideoPlayer({ src, isPlaying, videoRef, contentWidth }: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMouseMove = () => {
    setShowControls(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowControls(false), 2800);
  };
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div onMouseMove={handleMouseMove} onMouseLeave={() => setShowControls(false)}
      style={{
        alignSelf: 'center', width: contentWidth,
        border: `1px solid ${LCARS.purple}55`, borderRadius: 4, overflow: 'hidden',
        background: '#000', position: 'relative',
        boxShadow: `0 0 24px ${LCARS.purple}1a, 0 4px 16px rgba(0,0,0,0.5)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 12px 4px', background: 'rgba(0,0,0,0.7)', borderBottom: `1px solid ${LCARS.purple}33` }}>
        <span style={{ color: LCARS.purple, fontSize: 9, letterSpacing: 3, fontWeight: 700 }}>VIDEO STREAM</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5,
          color: isPlaying ? LCARS.alertRed : LCARS.subText, fontSize: 9, letterSpacing: 2, transition: 'color 200ms ease' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
            background: isPlaying ? LCARS.alertRed : LCARS.subText,
            boxShadow: isPlaying ? `0 0 6px ${LCARS.alertRed}` : 'none',
            transition: 'background 200ms ease, box-shadow 200ms ease' }} aria-hidden="true" />
          {isPlaying ? 'ACTIVE' : 'STANDBY'}
        </span>
      </div>
      {/* FIX #2: fluid height via aspect-ratio, no hard maxHeight that crops */}
      <video
        ref={videoRef}
        src={src}
        style={{ width: '100%', display: 'block', maxHeight: 'clamp(180px, 38vh, 420px)', background: '#000', objectFit: 'contain' }}
        playsInline
        controls={showControls}
        preload="metadata"
        aria-label={isPlaying ? 'Video player – playing' : 'Video player – paused'}
      />
      <div aria-hidden="true" style={{ position: 'absolute', top: 30, left: 0, width: 3, height: 36, background: LCARS.purple, borderRadius: '0 2px 2px 0', opacity: 0.55 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: 30, right: 0, width: 3, height: 36, background: LCARS.orange, borderRadius: '2px 0 0 2px', opacity: 0.55 }} />
    </div>
  );
}

export function VoxNovaPlayer() {
  const engine = useAudioEngine();
  const analyser = useFrequencyAnalyser();
  const library = useLibraryContext();

  const videoElRef = useRef<HTMLVideoElement>(null);

  const registry = useMemo(() => genRegistry(), []);
  const sectorTime = useSectorTime();

  const {
    view, setView, selectedId, setSelectedId, selectedTrack,
    handleSelect, handlePrev, handleNext,
  } = usePlayerNavigation({ tracks: library.tracks, engine });

  useEffect(() => {
    if (!selectedTrack?.isVideo) { engine.attachVideoElement(null); return; }
    const el = videoElRef.current;
    if (!el) return;
    engine.attachVideoElement(el);
    el.src = selectedTrack.url;
    el.load();
    el.play().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack?.id, selectedTrack?.isVideo]);

  const handlePurge = () => {
    if (typeof window !== 'undefined' && !window.confirm('Purge library? All local tracks will be removed.')) return;
    library.purge();
  };

  const contentWidth = '100%';

  return (
    <SidebarProvider>
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh',
        background: LCARS.bg, color: LCARS.text, fontFamily: LCARS.font,
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LCARSBackground />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <PlayerSidebar
              tracks={library.tracks}
              selectedId={selectedId}
              onSelect={handleSelect}
              onPurge={handlePurge}
              libraryCapacity={LIBRARY_CAPACITY}
              boxColors={LCARS_BOX_COLORS}
            />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column',
              padding: '12px 16px', gap: 10, overflow: 'auto', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${LCARS.purple}33`, paddingBottom: 6, marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BlackHoleBadge />
                  <span style={{ color: LCARS.amber, fontSize: 9, letterSpacing: 3, fontWeight: 700 }}>VOX NOVA</span>
                  <ChipIcon />
                  <span style={{ color: LCARS.subText, fontSize: 9, letterSpacing: 2 }}>REG·{registry}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <NetworkIcon />
                  <span style={{ color: LCARS.subText, fontSize: 9, letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>
                    STARDATE·{sectorTime}
                  </span>
                </div>
              </div>

              {selectedTrack?.isVideo && (
                <VideoPlayer
                  src={selectedTrack.url}
                  isPlaying={engine.isPlaying}
                  videoRef={videoElRef}
                  contentWidth={contentWidth}
                />
              )}

              <FrequencyVisualizer audioRef={engine.audioRef} isPlaying={engine.isPlaying} analyser={analyser} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: LCARS.amber, fontSize: 13, fontWeight: 700, letterSpacing: 1,
                    maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedTrack?.title ?? '— NO SIGNAL —'}
                  </span>
                  {selectedTrack && (
                    <span style={{ color: LCARS.subText, fontSize: 9, letterSpacing: 2 }}>
                      {selectedTrack.source === 'cloud' ? 'CLOUD' : 'LOCAL'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 9, letterSpacing: 1, lineHeight: 1.6 }}>
                  <TechSpecLine info={engine.trackInfo} duration={engine.duration} />
                </div>
              </div>

              <SeekBar currentTime={engine.currentTime} duration={engine.duration} onSeek={engine.seek} />

              <PlayerControls
                isPlaying={engine.isPlaying}
                onTogglePlay={engine.togglePlay}
                onPrev={handlePrev}
                onNext={handleNext}
                repeat={engine.repeat}
                onToggleRepeat={engine.toggleRepeat}
                shuffle={engine.shuffle}
                onToggleShuffle={engine.toggleShuffle}
                autoplay={engine.autoplay}
                onToggleAutoplay={engine.toggleAutoplay}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <VolumeControl volume={engine.volume} onSetVolume={engine.setVolume} />
                <StatusBar
                  isPlaying={engine.isPlaying}
                  currentTime={engine.currentTime}
                  duration={engine.duration}
                  crossfadeMs={engine.crossfadeMs}
                  onSetCrossfade={engine.setCrossfadeMs}
                  sleepTimerEnd={engine.sleepTimerEnd}
                  onSetSleepTimer={engine.setSleepTimer}
                />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${LCARS.purple}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: LCARS.subText, fontSize: 8, letterSpacing: 2 }}>
                  TRACKS·{library.tracks.length}/{LIBRARY_CAPACITY}
                </span>
                <button
                  onClick={() => setView(view === 'player' ? 'settings' : 'player')}
                  style={{ background: 'none', border: 'none', color: LCARS.subText,
                    fontSize: 8, letterSpacing: 2, cursor: 'pointer', padding: '2px 6px' }}
                  aria-label="Toggle settings"
                >
                  {view === 'settings' ? 'CLOSE CONFIG' : 'CONFIG'}
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

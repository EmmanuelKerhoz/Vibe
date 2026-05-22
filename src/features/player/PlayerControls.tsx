import type { AudioEngineState, RepeatMode } from './useAudioEngine';
import { LCARS } from './lcarsTheme';

interface PlayerControlsProps {
  engine: AudioEngineState;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}

// ── Inject keyframes once ───────────────────────────────────────────────────
const CONTROLS_CSS = `
  @keyframes lcarsLedPulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
    50%       { opacity: 0.55; box-shadow: 0 0 2px currentColor; }
  }
  @keyframes lcarsShuffleSpin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .lcars-led-active  { animation: lcarsLedPulse 1.8s ease-in-out infinite; }
  .lcars-btn:hover:not(:disabled) { filter: brightness(1.18); }
  .lcars-btn:active:not(:disabled) { transform: scale(0.96); }
  .lcars-transport:hover:not(:disabled) { filter: brightness(1.22); transform: scale(1.05); }
  .lcars-transport:active:not(:disabled) { transform: scale(0.94); }
  .lcars-play:hover:not(:disabled) { box-shadow: 0 0 48px var(--lcars-play-glow, #f5b06b88) !important; filter: brightness(1.12); }
  .lcars-play:active:not(:disabled) { transform: scale(0.95) !important; }
`;

let _cssInjected = false;
function injectControlsCSS() {
  if (_cssInjected) return;
  _cssInjected = true;
  const el = document.createElement('style');
  el.textContent = CONTROLS_CSS;
  document.head.appendChild(el);
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function IconShuffle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  );
}

function IconRepeat({ mode }: { mode: RepeatMode }) {
  if (mode === 'one') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        <text x="9.5" y="14.5" fontSize="6.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="monospace">1</text>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconAutoplay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
      <line x1="19" y1="3" x2="19" y2="21" />
    </svg>
  );
}

function IconCrossfade() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6 Q12 18 20 6" />
      <path d="M4 18 Q12 6 20 18" />
      <circle cx="4" cy="6" r="2" fill="currentColor" />
      <circle cx="20" cy="6" r="2" fill="currentColor" />
      <circle cx="4" cy="18" r="2" fill="currentColor" />
      <circle cx="20" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

function IconPrev() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h2v12H6zM9.5 12L20 6v12z" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 6h2v12h-2zM4 6v12l10.5-6z" />
    </svg>
  );
}

// ── LCARSModeButton ─────────────────────────────────────────────────────────
// A premium pill-shaped mode toggle with LED indicator, LCARS glow, label

interface LCARSModeButtonProps {
  label: string;
  sublabel?: string;
  active: boolean;
  disabled?: boolean;
  color: string;        // active accent color
  dimColor?: string;    // inactive tint
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}

function LCARSModeButton({
  label, sublabel, active, disabled, color, dimColor, onClick, title, children,
}: LCARSModeButtonProps) {
  const dim = dimColor ?? 'rgba(255,255,255,0.18)';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label + (sublabel ? ' — ' + sublabel : '')}
      aria-pressed={active}
      className="lcars-btn"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '10px 14px 8px',
        minWidth: 72,
        borderRadius: 6,
        border: `1px solid ${active ? color + 'cc' : color + '28'}`,
        background: active
          ? `linear-gradient(160deg, ${color}1a 0%, ${color}08 100%)`
          : 'rgba(0,0,0,0.28)',
        color: active ? color : dim,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.28 : 1,
        boxShadow: active
          ? `0 0 14px ${color}33, inset 0 1px 0 ${color}22, 0 1px 0 rgba(0,0,0,0.4)`
          : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(0,0,0,0.4)',
        transition: 'all 160ms cubic-bezier(0.16,1,0.3,1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* LED indicator */}
      <span
        className={active ? 'lcars-led-active' : undefined}
        style={{
          position: 'absolute',
          top: 6,
          right: 7,
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: active ? color : 'rgba(255,255,255,0.12)',
          color: color,
          transition: 'background 200ms ease',
        }}
        aria-hidden="true"
      />

      {/* Icon */}
      <span style={{ lineHeight: 0 }}>{children}</span>

      {/* Label */}
      <span
        style={{
          fontSize: 8,
          letterSpacing: 1.8,
          fontWeight: 700,
          fontFamily: 'inherit',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>

      {/* Sublabel (badge for repeat mode, etc.) */}
      {sublabel && (
        <span
          style={{
            fontSize: 7,
            letterSpacing: 1.2,
            fontWeight: 600,
            color: active ? color : 'rgba(255,255,255,0.25)',
            background: active ? color + '22' : 'transparent',
            padding: '1px 4px',
            borderRadius: 3,
            lineHeight: 1.2,
            transition: 'all 160ms ease',
          }}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────

function VertDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 1,
        height: 32,
        background: `linear-gradient(to bottom, transparent, ${LCARS.orange}30, transparent)`,
        flexShrink: 0,
      }}
    />
  );
}

// ── Repeat state display ────────────────────────────────────────────────────

const REPEAT_SUBLABEL: Record<RepeatMode, string | undefined> = {
  none: undefined,
  one: 'TRACK',
  all: 'ALL',
};

const REPEAT_TITLE: Record<RepeatMode, string> = {
  none: 'Repeat OFF — click for REPEAT·1',
  one: 'Repeat TRACK — click for REPEAT·ALL',
  all: 'Repeat ALL — click to disable',
};

// ── Main component ───────────────────────────────────────────────────────────

export function PlayerControls({ engine, onPrev, onNext, disabled }: PlayerControlsProps) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isPlaying, togglePlay, repeat, shuffle, autoplay, toggleRepeat, toggleShuffle, toggleAutoplay } = engine;

  // Inject CSS once
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const injectedRef = { current: false };
  if (!injectedRef.current) {
    injectControlsCSS();
    injectedRef.current = true;
  }

  const transportSquare: React.CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: 8,
    background: LCARS.panelDark,
    border: `1px solid ${LCARS.peach}28`,
    color: LCARS.peach,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 140ms cubic-bezier(0.16,1,0.3,1)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.4)',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      padding: '10px 0 4px',
      width: '100%',
    }}>

      {/* ── Mode strip ── */}
      <div
        role="group"
        aria-label="Playback modes"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.22)',
          borderRadius: 8,
          border: `1px solid ${LCARS.orange}18`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* SHUFFLE */}
        <LCARSModeButton
          label="SHUFFLE"
          active={shuffle}
          color={LCARS.orange}
          onClick={toggleShuffle}
          title={shuffle ? 'Shuffle ON — click to disable' : 'Shuffle OFF — click to enable'}
        >
          <IconShuffle />
        </LCARSModeButton>

        <VertDivider />

        {/* REPEAT — cycles none → one → all */}
        <LCARSModeButton
          label="REPEAT"
          sublabel={REPEAT_SUBLABEL[repeat]}
          active={repeat !== 'none'}
          color={LCARS.purple}
          onClick={toggleRepeat}
          title={REPEAT_TITLE[repeat]}
        >
          <IconRepeat mode={repeat} />
        </LCARSModeButton>

        <VertDivider />

        {/* AUTOPLAY */}
        <LCARSModeButton
          label="AUTOPLAY"
          active={autoplay}
          color={LCARS.peach}
          onClick={toggleAutoplay}
          title={autoplay ? 'Auto-advance ON — click to disable' : 'Auto-advance OFF — click to enable'}
        >
          <IconAutoplay />
        </LCARSModeButton>

        <VertDivider />

        {/* CROSSFADE — stub */}
        <LCARSModeButton
          label="XFADE"
          sublabel="SOON"
          active={false}
          disabled
          color={LCARS.subText}
          onClick={() => {}}
          title="Crossfade — coming soon"
        >
          <IconCrossfade />
        </LCARSModeButton>
      </div>

      {/* ── LCARS label strip under mode row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        width: '100%',
        justifyContent: 'center',
      }}>
        <div style={{ flex: 1, height: 2, background: `linear-gradient(to right, transparent, ${LCARS.peach}33)` }} />
        <span style={{
          color: LCARS.subText,
          fontSize: 8,
          letterSpacing: 3,
          fontWeight: 700,
          padding: '0 10px',
          whiteSpace: 'nowrap',
        }}>PLAYBACK CONTROL MATRIX</span>
        <div style={{ flex: 1, height: 2, background: `linear-gradient(to left, transparent, ${LCARS.peach}33)` }} />
      </div>

      {/* ── Transport row ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
      }}>
        <button
          type="button"
          aria-label="Previous track"
          onClick={onPrev}
          disabled={disabled}
          className="lcars-transport"
          style={transportSquare}
        >
          <IconPrev />
        </button>

        <button
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={togglePlay}
          disabled={disabled}
          className="lcars-play"
          style={{
            '--lcars-play-glow': LCARS.peach + '88',
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: `radial-gradient(circle at 38% 35%, ${LCARS.peach}ee, ${LCARS.peach}bb)`,
            border: `2px solid ${LCARS.peach}`,
            color: '#000',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.45 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isPlaying
              ? `0 0 36px ${LCARS.peach}66, 0 0 72px ${LCARS.peach}22, inset 0 2px 0 rgba(255,255,255,0.35)`
              : `0 0 18px ${LCARS.peach}33, inset 0 2px 0 rgba(255,255,255,0.25)`,
            transition: 'box-shadow 300ms ease, transform 140ms cubic-bezier(0.16,1,0.3,1)',
          } as React.CSSProperties}
        >
          {isPlaying ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ transform: 'translateX(2px)' }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          aria-label="Next track"
          onClick={onNext}
          disabled={disabled}
          className="lcars-transport"
          style={transportSquare}
        >
          <IconNext />
        </button>
      </div>

      {/* ── Playback state indicator ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: LCARS.subText,
        fontSize: 9,
        letterSpacing: 2.5,
        fontWeight: 600,
      }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isPlaying ? '#4cff91' : LCARS.subText,
            boxShadow: isPlaying ? '0 0 8px #4cff9188' : 'none',
            transition: 'all 400ms ease',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <span>
          {isPlaying ? 'TRANSMITTING' : 'STANDBY'}
          {shuffle ? ' · SHF' : ''}
          {repeat !== 'none' ? ` · RPT:${repeat.toUpperCase()}` : ''}
          {!autoplay && !isPlaying ? ' · HOLD' : ''}
        </span>
      </div>
    </div>
  );
}

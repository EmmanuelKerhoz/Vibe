import { LCARS } from './lcarsTheme';
import { SPOTIFY_GREEN, LCARS_BOX_COLORS } from './playerConstants';
import { useSpotifyAuthActions, useSpotifyAuthState } from '../../contexts/SpotifyAuthContext';
import { useSpotifyEngine_ } from '../../contexts/SpotifyEngineContext';
import type { TrackInfo } from './useAudioEngine';
import type { TrackEntry } from './types';
import { formatCloudProviderLabel } from '../../utils/cloudProviders';

// ─── formatDate ───────────────────────────────────────────────────────────────

function formatDate(value?: string): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toLocaleDateString() : null;
}

// ─── OneDriveMetaLine ─────────────────────────────────────────────────────────

function OneDriveMetaLine({ track }: { track: TrackEntry }) {
  const providerLabel = track.cloudProvider
    ? formatCloudProviderLabel(track.cloudProvider)
    : track.source.toUpperCase();
  const items: Array<{ label: string; value: string; color: string }> = [];
  items.push({
    label: 'SOURCE',
    value: providerLabel,
    color: track.source === 'local' ? LCARS.orange : track.source === 'lyria' ? '#00c8a0' : LCARS.purple,
  });
  const modified = formatDate(track.oneDriveLastModified);
  if (modified) items.push({ label: 'MODIFIED', value: modified, color: LCARS.subText });
  items.push({
    label: 'LINK',
    value: track.linked ? 'RESOLVED' : 'PENDING',
    color: track.linked ? LCARS.peach : LCARS.mutedText,
  });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0', marginBottom: 6 }}>
      {items.map((item, i) => (
        <span key={item.label} style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
          {i > 0 && <span style={{ color: 'rgba(153,102,204,0.45)', margin: '0 6px' }}>│</span>}
          <span style={{ color: LCARS.subText }}>{item.label}:</span>{' '}
          <span style={{ color: item.color }}>{item.value}</span>
        </span>
      ))}
    </div>
  );
}

// ─── TechSpecLine ─────────────────────────────────────────────────────────────

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

// ─── SpotifyAuthBlock ─────────────────────────────────────────────────────────

function SpotifyAuthBlock() {
  const { status, error } = useSpotifyAuthState();
  const { login, logout } = useSpotifyAuthActions();

  const statusColor =
    status === 'authenticated' ? SPOTIFY_GREEN
    : status === 'error' ? LCARS.alertRed
    : LCARS.subText;
  const statusLabel =
    status === 'idle' ? 'STANDBY'
    : status === 'authenticating' ? 'CONNECTING…'
    : status === 'authenticated' ? 'LINK ESTABLISHED'
    : 'LINK ERROR';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={SPOTIFY_GREEN} aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.786-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.519-.973c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 01.257 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.794c3.525-1.07 9.386-.863 13.087 1.306a.938.938 0 01-.927 1.645z" />
        </svg>
        <span style={{ color: SPOTIFY_GREEN, fontSize: 10, letterSpacing: 3, fontWeight: 700 }}>SPOTIFY LINK</span>
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor,
          boxShadow: status === 'authenticated' ? `0 0 6px ${SPOTIFY_GREEN}` : 'none' }} />
        <span style={{ color: statusColor, fontSize: 9, letterSpacing: 2 }}>{statusLabel}</span>
      </span>
      <span style={{ flex: 1 }} aria-hidden="true" />
      {status === 'authenticated' ? (
        <button
          onClick={logout}
          aria-label="Disconnect Spotify"
          style={{
            background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)',
            borderRadius: 3, color: LCARS.alertRed, fontSize: 9, letterSpacing: 2,
            padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
          }}
        >DISCONNECT</button>
      ) : (
        <button
          onClick={() => void login()}
          disabled={status === 'authenticating'}
          aria-label="Connect to Spotify"
          style={{
            background: status === 'authenticating' ? 'rgba(29,185,84,0.08)' : `${SPOTIFY_GREEN}22`,
            border: `1px solid ${SPOTIFY_GREEN}55`,
            borderRadius: 3, color: SPOTIFY_GREEN, fontSize: 9, letterSpacing: 2,
            padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
            opacity: status === 'authenticating' ? 0.6 : 1,
          }}
        >{status === 'authenticating' ? 'CONNECTING…' : 'CONNECT'}</button>
      )}
      {error && (
        <div role="alert" style={{ flexBasis: '100%', color: LCARS.alertRed, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

// ─── VoxNovaLocalMemo ─────────────────────────────────────────────────────────

export interface VoxNovaLocalMemoProps {
  contentWidth: string;
  memo: string;
  selectedTrack: TrackEntry | null | undefined;
  trackInfo: TrackInfo | null;
  duration: number;
}

export function VoxNovaLocalMemo({
  contentWidth,
  memo,
  selectedTrack,
  trackInfo,
  duration,
}: VoxNovaLocalMemoProps) {
  return (
    <div style={{ alignSelf: 'center', width: contentWidth, border: `1px solid ${LCARS.purple}55`, borderRadius: 4, padding: '10px 14px', background: LCARS_BOX_COLORS[1] }}>
      <div style={{ color: LCARS.purple, fontSize: 10, letterSpacing: 3, marginBottom: 6 }}>LOCAL MEMO LOG</div>
      <div style={{ color: LCARS.text, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word', marginBottom: selectedTrack ? 8 : 0 }}>{memo}</div>
      {selectedTrack && <OneDriveMetaLine track={selectedTrack} />}
      {selectedTrack && (
        <div style={{ borderTop: `1px solid ${LCARS.purple}22`, paddingTop: 6, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: LCARS.subText, marginRight: 6 }}>SIGNAL_ANALYSIS</span>
          <TechSpecLine info={trackInfo} duration={duration} />
        </div>
      )}
    </div>
  );
}

// ─── VoxNovaSpotifyMemo ───────────────────────────────────────────────────────

export interface VoxNovaSpotifyMemoProps {
  contentWidth: string;
  playerState: ReturnType<typeof useSpotifyEngine_>['playerState'];
  track: ReturnType<typeof useSpotifyEngine_>['playbackState'] extends infer T
    ? T extends { track_window: { current_track: infer U } } ? U | undefined : undefined
    : undefined;
}

export function VoxNovaSpotifyMemo({ contentWidth, playerState, track }: VoxNovaSpotifyMemoProps) {
  const memo = track
    ? `[SPOTIFY_STREAM] Locked on "${track.name}" — ${(track.artists ?? []).map(a => a.name).join(', ')}`
    : '[SPOTIFY_STREAM] Standby — awaiting selection from the Spotify browser.';
  const deviceLabel =
    playerState === 'idle' ? 'STANDBY'
    : playerState === 'loading' ? 'INITIALIZING…'
    : playerState === 'ready' ? 'DEVICE READY'
    : playerState === 'playing' ? 'STREAMING'
    : playerState === 'error' ? 'ERROR'
    : 'STANDBY';
  const deviceColor =
    playerState === 'ready' || playerState === 'playing' ? SPOTIFY_GREEN
    : playerState === 'error' ? LCARS.alertRed
    : LCARS.subText;

  return (
    <div style={{ alignSelf: 'center', width: contentWidth, border: `1px solid ${SPOTIFY_GREEN}44`,
      borderRadius: 4, padding: '10px 14px', background: 'rgba(29,185,84,0.06)' }}>
      <div style={{ color: SPOTIFY_GREEN, fontSize: 10, letterSpacing: 3, marginBottom: 6 }}>SPOTIFY TRANSMISSION LOG</div>
      <div style={{ color: LCARS.text, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word', marginBottom: 8 }}>
        {memo}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0', marginBottom: 4 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
          <span style={{ color: LCARS.subText }}>SOURCE:</span>{' '}
          <span style={{ color: SPOTIFY_GREEN }}>SPOTIFY</span>
        </span>
        <span style={{ color: 'rgba(29,185,84,0.45)', margin: '0 6px' }}>│</span>
        <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
          <span style={{ color: LCARS.subText }}>DEVICE:</span>{' '}
          <span style={{ color: deviceColor }}>{deviceLabel}</span>
        </span>
        {track?.album?.name && (
          <>
            <span style={{ color: 'rgba(29,185,84,0.45)', margin: '0 6px' }}>│</span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
              <span style={{ color: LCARS.subText }}>ALBUM:</span>{' '}
              <span style={{ color: LCARS.peach }}>{track.album.name}</span>
            </span>
          </>
        )}
      </div>
      <SpotifyAuthBlock />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { LCARS } from './lcarsTheme';
import { useSpotifyPlaylists, formatMs } from './useSpotifyPlaylists';
import type { SpotifyPlaylistItem } from './useSpotifyPlaylists';
import type { SpotifyEngineControls } from '../../hooks/useSpotifyEngine';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function IconPlaylist() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <polygon points="3 6 3 18 6 12" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}
      aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TrackRow({
  name, artists, durationMs, albumImageUrl, onPlay,
}: {
  name: string; artists: string; durationMs: number;
  albumImageUrl: string | null; onPlay: () => void;
}) {
  return (
    <div
      role="listitem"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 8px', borderRadius: 4,
        cursor: 'pointer',
        transition: 'background 140ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {albumImageUrl ? (
        <img src={albumImageUrl} alt="" width={28} height={28}
          style={{ borderRadius: 3, flexShrink: 0, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: 3, flexShrink: 0,
          background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconPlay />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: LCARS.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        <div style={{ fontSize: 9, color: LCARS.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: 0.5 }}>
          {artists}
        </div>
      </div>
      <span style={{ fontSize: 9, color: LCARS.subText, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        {formatMs(durationMs)}
      </span>
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${name}`}
        style={{
          flexShrink: 0, background: 'transparent', border: `1px solid ${LCARS.green}55`,
          borderRadius: 3, color: LCARS.green, cursor: 'pointer',
          width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 140ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = LCARS.green + '22'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <IconPlay />
      </button>
    </div>
  );
}

function PlaylistRow({
  playlist, isOpen, onToggle, onPlayContext,
  tracks, tracksStatus, onPlayTrack,
}: {
  playlist: SpotifyPlaylistItem;
  isOpen: boolean;
  onToggle: () => void;
  onPlayContext: () => void;
  tracks: ReturnType<typeof import('./useSpotifyPlaylists').useSpotifyPlaylists>['tracksByPlaylist'][string] | undefined;
  tracksStatus: 'idle' | 'loading' | 'loaded' | 'error';
  onPlayTrack: (uri: string) => void;
}) {
  return (
    <div style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
      {/* Header row */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
          cursor: 'pointer', userSelect: 'none',
          transition: 'background 140ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {playlist.imageUrl ? (
          <img src={playlist.imageUrl} alt="" width={32} height={32}
            style={{ borderRadius: 4, flexShrink: 0, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: 4, flexShrink: 0,
            background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: LCARS.subText }}>
            <IconPlaylist />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: LCARS.text, fontWeight: 700,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {playlist.name}
          </div>
          <div style={{ fontSize: 9, color: LCARS.subText, letterSpacing: 1 }}>
            {playlist.tracksTotal} TRACKS
          </div>
        </div>
        {/* Play context button */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onPlayContext(); }}
          aria-label={`Play playlist ${playlist.name}`}
          style={{
            flexShrink: 0, background: 'transparent',
            border: `1px solid ${LCARS.peach}55`, borderRadius: 3,
            color: LCARS.peach, cursor: 'pointer',
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 140ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = LCARS.peach + '22'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <IconPlay />
        </button>
        <IconChevron open={isOpen} />
      </div>

      {/* Track list (expanded) */}
      {isOpen && (
        <div style={{ paddingBottom: 4 }} role="list" aria-label={`Tracks in ${playlist.name}`}>
          {tracksStatus === 'loading' && (
            <div style={{ padding: '8px 16px', fontSize: 9, color: LCARS.subText, letterSpacing: 2 }}>LOADING…</div>
          )}
          {tracksStatus === 'error' && (
            <div style={{ padding: '8px 16px', fontSize: 9, color: LCARS.alertRed, letterSpacing: 2 }}>FETCH ERROR</div>
          )}
          {tracksStatus === 'loaded' && tracks?.map(track => (
            <TrackRow
              key={track.id}
              name={track.name}
              artists={track.artists}
              durationMs={track.durationMs}
              albumImageUrl={track.albumImageUrl}
              onPlay={() => onPlayTrack(track.uri)}
            />
          ))}
          {tracksStatus === 'loaded' && (!tracks || tracks.length === 0) && (
            <div style={{ padding: '8px 16px', fontSize: 9, color: LCARS.subText, letterSpacing: 2 }}>NO TRACKS</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export interface SpotifyPlaylistPanelProps {
  accessToken: string | null | undefined;
  controls: SpotifyEngineControls;
  deviceId: string | null;
}

export function SpotifyPlaylistPanel({ accessToken, controls, deviceId }: SpotifyPlaylistPanelProps) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    playlists, playlistsStatus,
    fetchPlaylists,
    tracksByPlaylist, tracksStatus, fetchTracks,
  } = useSpotifyPlaylists(accessToken);

  // Auto-fetch on first open
  useEffect(() => {
    if (open && playlistsStatus === 'idle') {
      void fetchPlaylists();
    }
  }, [open, playlistsStatus, fetchPlaylists]);

  function handleTogglePlaylist(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      void fetchTracks(id);
    }
  }

  async function handlePlayContext(playlist: SpotifyPlaylistItem) {
    if (!deviceId) return;
    // Play the whole playlist as context
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: playlist.uri }),
    });
  }

  async function handlePlayTrack(trackUri: string) {
    await controls.play([trackUri]);
  }

  return (
    <div style={{ width: '100%', marginTop: 8 }}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Toggle playlist browser"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', borderRadius: 4,
          background: open ? `rgba(80,200,180,0.08)` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? LCARS.green + '55' : 'rgba(255,255,255,0.10)'}`,
          color: open ? LCARS.green : LCARS.subText,
          cursor: 'pointer', transition: 'all 160ms ease',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <IconPlaylist />
          <span style={{ fontSize: 9, letterSpacing: 2, fontWeight: 700, fontFamily: 'inherit' }}>MY PLAYLISTS</span>
          {playlistsStatus === 'loaded' && (
            <span style={{ fontSize: 8, color: LCARS.subText, letterSpacing: 1 }}>({playlists.length})</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {open && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); void fetchPlaylists(); }}
              aria-label="Refresh playlists"
              title="Refresh"
              style={{
                background: 'transparent', border: 'none',
                color: LCARS.subText, cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: 2,
                transition: 'color 140ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = LCARS.text; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = LCARS.subText; }}
            >
              <IconRefresh />
            </button>
          )}
          <IconChevron open={open} />
        </div>
      </button>

      {/* Playlist list */}
      {open && (
        <div style={{
          marginTop: 4, borderRadius: 4, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.28)',
          maxHeight: 360, overflowY: 'auto',
        }}>
          {playlistsStatus === 'loading' && (
            <div style={{ padding: '16px', fontSize: 9, color: LCARS.subText, letterSpacing: 3, textAlign: 'center' }}>SCANNING SECTORS…</div>
          )}
          {playlistsStatus === 'error' && (
            <div style={{ padding: '12px', fontSize: 9, color: LCARS.alertRed, letterSpacing: 2, textAlign: 'center' }}>SIGNAL LOST — RETRY</div>
          )}
          {playlistsStatus === 'loaded' && playlists.length === 0 && (
            <div style={{ padding: '12px', fontSize: 9, color: LCARS.subText, letterSpacing: 2, textAlign: 'center' }}>NO PLAYLISTS FOUND</div>
          )}
          {playlistsStatus === 'loaded' && playlists.map(pl => (
            <PlaylistRow
              key={pl.id}
              playlist={pl}
              isOpen={expandedId === pl.id}
              onToggle={() => handleTogglePlaylist(pl.id)}
              onPlayContext={() => handlePlayContext(pl)}
              tracks={tracksByPlaylist[pl.id]}
              tracksStatus={tracksStatus[pl.id] ?? 'idle'}
              onPlayTrack={handlePlayTrack}
            />
          ))}
        </div>
      )}
    </div>
  );
}

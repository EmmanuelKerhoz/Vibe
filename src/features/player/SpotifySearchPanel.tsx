import { useState } from 'react';
import { useSpotifySearch } from './useSpotifySearch';
import { useSpotifyEngine_ } from '../../contexts/SpotifyEngineContext';
import { formatMs } from './useSpotifyPlaylists';
import { LCARS } from './lcarsTheme';

const SPOTIFY_GREEN = '#1DB954';

export function SpotifySearchPanel() {
  const { controls, playbackState } = useSpotifyEngine_();
  const { query, setQuery, searching, error, results, search } = useSpotifySearch();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const currentUri = playbackState?.track_window?.current_track?.uri ?? null;

  return (
    <div style={{
      alignSelf: 'center', width: 'min(680px, 95%)',
      border: `1px solid ${SPOTIFY_GREEN}33`, borderRadius: 4,
      background: 'rgba(29,185,84,0.04)', overflow: 'hidden',
    }}>
      <form
        onSubmit={(e) => { e.preventDefault(); void search(); }}
        style={{ display: 'flex', gap: 8, padding: 10, borderBottom: `1px solid ${SPOTIFY_GREEN}22` }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tracks, artists, albums…"
          aria-label="Search Spotify tracks"
          style={{
            flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.45)', color: LCARS.text,
            border: `1px solid ${SPOTIFY_GREEN}55`, borderRadius: 3, padding: '7px 9px',
            fontFamily: 'inherit', fontSize: 12,
          }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{
            background: `${SPOTIFY_GREEN}22`, color: SPOTIFY_GREEN,
            border: `1px solid ${SPOTIFY_GREEN}66`, borderRadius: 3,
            padding: '7px 10px', fontSize: 10, letterSpacing: 1, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {searching ? 'SEARCHING…' : 'SEARCH'}
        </button>
      </form>

      {error && <div role="alert" style={{ padding: '8px 10px', color: LCARS.alertRed, fontSize: 10 }}>{error}</div>}

      {!error && !searching && query.trim() && results.length === 0 && (
        <div style={{ padding: '12px 10px', color: LCARS.subText, fontSize: 10, letterSpacing: 1 }}>No tracks found.</div>
      )}

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {results.map((track) => {
          const isActive = track.uri === currentUri;
          const isHovered = hoveredId === track.id;
          return (
            <button
              key={track.id}
              onMouseEnter={() => setHoveredId(track.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => void controls.play({ uris: [track.uri] })}
              style={{
                width: '100%', border: 'none',
                background: isActive ? `${SPOTIFY_GREEN}20` : isHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', textAlign: 'left', cursor: 'pointer',
              }}
            >
              {track.albumArtUrl
                ? <img src={track.albumArtUrl} alt="" width={30} height={30} style={{ borderRadius: 2, flexShrink: 0 }} />
                : <div style={{ width: 30, height: 30, borderRadius: 2, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} aria-hidden="true" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: isActive ? SPOTIFY_GREEN : LCARS.text, fontSize: 11, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</div>
                <div style={{ color: LCARS.subText, fontSize: 9, letterSpacing: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artists} · {track.albumName}</div>
              </div>
              <span style={{ color: LCARS.mutedText, fontFamily: 'monospace', fontSize: 9 }}>{formatMs(track.durationMs)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

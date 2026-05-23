import { useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  tracksTotal: number;
  uri: string;
}

export interface SpotifyTrackItem {
  id: string;
  uri: string;
  name: string;
  artists: string;
  durationMs: number;
  albumImageUrl: string | null;
}

export type PlaylistsStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type TracksStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface UseSpotifyPlaylistsResult {
  playlists: SpotifyPlaylistItem[];
  playlistsStatus: PlaylistsStatus;
  fetchPlaylists: () => Promise<void>;
  /** tracks keyed by playlist id */
  tracksByPlaylist: Record<string, SpotifyTrackItem[]>;
  tracksStatus: Record<string, TracksStatus>;
  fetchTracks: (playlistId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
export { formatMs };

async function spotifyGet<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Spotify API ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSpotifyPlaylists(accessToken: string | null | undefined): UseSpotifyPlaylistsResult {
  const [playlists, setPlaylists] = useState<SpotifyPlaylistItem[]>([]);
  const [playlistsStatus, setPlaylistsStatus] = useState<PlaylistsStatus>('idle');
  const [tracksByPlaylist, setTracksByPlaylist] = useState<Record<string, SpotifyTrackItem[]>>({});
  const [tracksStatus, setTracksStatus] = useState<Record<string, TracksStatus>>({});

  const fetchingRef = useRef(false);

  const fetchPlaylists = useCallback(async () => {
    if (!accessToken || fetchingRef.current) return;
    fetchingRef.current = true;
    setPlaylistsStatus('loading');
    try {
      const all: SpotifyPlaylistItem[] = [];
      let url: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50';
      while (url) {
        const data = await spotifyGet<{
          items: Array<{
            id: string; name: string; description: string;
            images: Array<{ url: string }>;
            tracks: { total: number };
            uri: string;
          }>;
          next: string | null;
        }>(url, accessToken);
        for (const p of data.items) {
          all.push({
            id: p.id,
            name: p.name,
            description: p.description,
            imageUrl: p.images?.[0]?.url ?? null,
            tracksTotal: p.tracks.total,
            uri: p.uri,
          });
        }
        url = data.next;
      }
      setPlaylists(all);
      setPlaylistsStatus('loaded');
    } catch (e) {
      console.error('[useSpotifyPlaylists]', e);
      setPlaylistsStatus('error');
    } finally {
      fetchingRef.current = false;
    }
  }, [accessToken]);

  const fetchTracks = useCallback(async (playlistId: string) => {
    if (!accessToken) return;
    if (tracksByPlaylist[playlistId]) return; // already loaded
    setTracksStatus(prev => ({ ...prev, [playlistId]: 'loading' }));
    try {
      const all: SpotifyTrackItem[] = [];
      let url: string | null =
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&fields=next,items(track(id,uri,name,duration_ms,artists(name),album(images)))`;
      while (url) {
        const data = await spotifyGet<{
          items: Array<{ track: {
            id: string | null; uri: string; name: string;
            duration_ms: number;
            artists: Array<{ name: string }>;
            album: { images: Array<{ url: string }> };
          } | null }>;
          next: string | null;
        }>(url, accessToken);
        for (const item of data.items) {
          const t = item.track;
          if (!t || !t.id) continue; // local files have null id
          all.push({
            id: t.id,
            uri: t.uri,
            name: t.name,
            artists: t.artists.map(a => a.name).join(', '),
            durationMs: t.duration_ms,
            albumImageUrl: t.album?.images?.[0]?.url ?? null,
          });
        }
        url = data.next;
      }
      setTracksByPlaylist(prev => ({ ...prev, [playlistId]: all }));
      setTracksStatus(prev => ({ ...prev, [playlistId]: 'loaded' }));
    } catch (e) {
      console.error('[useSpotifyPlaylists] fetchTracks', e);
      setTracksStatus(prev => ({ ...prev, [playlistId]: 'error' }));
    }
  }, [accessToken, tracksByPlaylist]);

  return { playlists, playlistsStatus, fetchPlaylists, tracksByPlaylist, tracksStatus, fetchTracks };
}

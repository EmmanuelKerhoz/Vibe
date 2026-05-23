import { useCallback, useState } from 'react';
import { useSpotifyAuth } from '../../contexts/SpotifyAuthContext';

export interface SpotifySearchTrack {
  id: string;
  uri: string;
  name: string;
  artists: string;
  durationMs: number;
  albumName: string;
  albumArtUrl: string | null;
}

interface SpotifySearchState {
  query: string;
  setQuery: (value: string) => void;
  searching: boolean;
  error: string | null;
  results: SpotifySearchTrack[];
  search: (q?: string) => Promise<void>;
}

export function useSpotifySearch(): SpotifySearchState {
  const { status, getValidToken } = useSpotifyAuth();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);

  const search = useCallback(async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) {
      setResults([]);
      setError(null);
      return;
    }
    if (status !== 'authenticated') {
      setError('Connect Spotify to search.');
      setResults([]);
      return;
    }

    const token = await getValidToken();
    if (!token) {
      setError('Spotify token unavailable.');
      setResults([]);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const endpoint = `https://api.spotify.com/v1/search?type=track&limit=25&q=${encodeURIComponent(term)}`;
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Spotify API ${res.status}: ${res.statusText}`);
      const data = await res.json() as {
        tracks?: {
          items?: Array<{
            id: string;
            uri: string;
            name: string;
            duration_ms: number;
            artists: Array<{ name: string }>;
            album: { name: string; images?: Array<{ url: string }> };
          }>;
        };
      };
      setResults((data.tracks?.items ?? []).map(item => ({
        id: item.id,
        uri: item.uri,
        name: item.name,
        artists: item.artists.map(a => a.name).join(', '),
        durationMs: item.duration_ms,
        albumName: item.album.name,
        albumArtUrl: item.album.images?.[0]?.url ?? null,
      })));
    } catch (err) {
      setError((err as Error).message ?? 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [getValidToken, query, status]);

  return { query, setQuery, searching, error, results, search };
}

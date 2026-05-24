/**
 * useSpotifyPlaylists
 * Fetches the authenticated user's playlists and, lazily, their tracks.
 *
 * - Uses SpotifyAuthContext tokens via shared spotify API client.
 * - AbortController cancels in-flight requests on unmount / token change.
 * - Playlist tracks are loaded on-demand when a playlist is expanded.
 *
 * Feb 2026 migration:
 *   - /playlists/{id}/tracks → /playlists/{id}/items (renamed endpoint)
 *   - Only playlists owned by the current user are shown; shared/collaborative
 *     playlists are excluded at source to avoid Dev Mode 403s.
 *
 * May 2026 (v1.31.0.55):
 *   - TRACK_PAGE_SCHEMA hardened against podcast episodes and local files.
 *     Items with uri not starting with 'spotify:track:' are silently skipped.
 *
 * May 2026 (v1.31.0.56):
 *   - fetchTracks: retry allowed when previous attempt errored (tap again
 *     clears error and re-fetches instead of silently no-op).
 *   - playlistsCache: reload() always bypasses cache regardless of TTL,
 *     so stale module-level cache from before owner-filter deploy is busted.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ZodError, z } from 'zod';
import { useSpotifyAuth } from '../../contexts/SpotifyAuthContext';
import { useSpotifyApiClient } from './useSpotifyApiClient';
import { SpotifyApiError } from './spotifyApi';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  totalTracks: number;
  uri: string;
}

export interface SpotifyTrackItem {
  id: string;
  name: string;
  uri: string;
  durationMs: number;
  artists: string;
  albumArtUrl: string | null;
  isPlayable: boolean;
}

export interface PlaylistsState {
  playlists: SpotifyPlaylist[];
  loading: boolean;
  error: string | null;
  /** tracks keyed by playlist id */
  tracks: Record<string, SpotifyTrackItem[]>;
  tracksLoading: Record<string, boolean>;
  tracksError: Record<string, string | null>;
  fetchTracks: (playlistId: string) => void;
  reload: () => void;
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
export { formatMs };

const ME_SCHEMA = z.object({
  id: z.string(),
});

const PLAYLIST_PAGE_SCHEMA = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable().optional(),
      images: z.array(z.object({ url: z.string() })).nullable().optional(),
      tracks: z.object({ total: z.number() }).nullable().optional(),
      uri: z.string(),
      owner: z.object({ id: z.string() }),
    }),
  ),
  next: z.string().nullable(),
});

/**
 * TRACK_PAGE_SCHEMA — resilient to heterogeneous playlist items.
 *
 * A Spotify playlist /items response can contain:
 *   - Regular tracks   (type: 'track', uri: 'spotify:track:…')
 *   - Podcast episodes (type: 'episode', uri: 'spotify:episode:…')
 *   - Local files      (id: null, uri: 'spotify:local:…')
 *   - Null items       (track: null — deleted/unavailable)
 *
 * .passthrough() means unknown fields (episode-only props) are ignored
 * instead of throwing ZodError. The filter in fetchTracks discards
 * anything that isn't a real spotify:track: URI.
 */
const TRACK_ITEM_SCHEMA = z
  .object({
    id: z.string().nullable(),
    name: z.string(),
    uri: z.string().nullable(),
    type: z.string().optional(),
    duration_ms: z.number().optional().default(0),
    is_playable: z.boolean().optional(),
    artists: z.array(z.object({ name: z.string() })).optional().default([]),
    album: z
      .object({
        images: z.array(z.object({ url: z.string() })).optional(),
      })
      .optional(),
  })
  .passthrough();

const TRACK_PAGE_SCHEMA = z.object({
  next: z.string().nullable(),
  items: z.array(
    z.object({
      track: TRACK_ITEM_SCHEMA.nullable(),
    }).passthrough(),
  ),
});

type PlaylistPage = z.infer<typeof PLAYLIST_PAGE_SCHEMA>;
type TrackPage = z.infer<typeof TRACK_PAGE_SCHEMA>;

// TTL kept at 2 min but only used when tick === 0 (initial mount).
// reload() increments tick, which always bypasses cache.
const PLAYLISTS_CACHE_TTL_MS = 2 * 60_000;

let playlistsCache: { value: SpotifyPlaylist[]; fetchedAt: number } | null = null;
const tracksCache = new Map<string, SpotifyTrackItem[]>();
let cacheAccessToken: string | null = null;

function syncCacheScope(accessToken: string | null): void {
  if (cacheAccessToken === accessToken) return;
  playlistsCache = null;
  tracksCache.clear();
  cacheAccessToken = accessToken;
}

export function useSpotifyPlaylists(): PlaylistsState {
  const { status, accessToken } = useSpotifyAuth();
  const { request, getErrorMessage } = useSpotifyApiClient();

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Record<string, SpotifyTrackItem[]>>(
    () => Object.fromEntries(tracksCache.entries()),
  );
  const [tracksLoading, setTracksLoading] = useState<Record<string, boolean>>({});
  const [tracksError, setTracksError] = useState<Record<string, string | null>>({});

  const abortRef = useRef<AbortController | null>(null);
  // tick === 0: use cache if fresh. tick > 0: always refetch (reload() call).
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => {
    // Bust module-level cache so the next fetch re-filters with current userId.
    playlistsCache = null;
    tracksCache.clear();
    setTracks({});
    setTracksLoading({});
    setTracksError({});
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    syncCacheScope(accessToken);
    setTracks(Object.fromEntries(tracksCache.entries()));
    setTracksLoading({});
    setTracksError({});
  }, [accessToken]);

  useEffect(() => {
    syncCacheScope(accessToken);

    if (status !== 'authenticated' || !accessToken) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    // Only use cache on initial mount (tick === 0) and within TTL.
    const hasFreshCache =
      tick === 0 &&
      playlistsCache !== null &&
      Date.now() - playlistsCache.fetchedAt < PLAYLISTS_CACHE_TTL_MS;
    if (hasFreshCache && playlistsCache) {
      setPlaylists(playlistsCache.value);
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      // Resolve the current user's Spotify ID to filter owned playlists.
      const me = await request<{ id: string }>('https://api.spotify.com/v1/me', {
        signal: ctrl.signal,
        parse: (payload) => ME_SCHEMA.parse(payload),
      });
      const userId = me.id;

      const collected: SpotifyPlaylist[] = [];
      let url: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50';

      while (url) {
        const page: PlaylistPage = await request<PlaylistPage>(url, {
          signal: ctrl.signal,
          parse: (payload) => PLAYLIST_PAGE_SCHEMA.parse(payload),
        });
        for (const item of page.items) {
          // Exclude playlists not owned by the current user (shared, collaborative,
          // Spotify editorial) — they trigger 403 on /items in Dev Mode.
          if (item.owner.id !== userId) continue;
          collected.push({
            id: item.id,
            name: item.name,
            description: item.description || null,
            imageUrl: item.images?.[0]?.url ?? null,
            totalTracks: item.tracks?.total ?? 0,
            uri: item.uri,
          });
        }
        url = page.next;
      }

      playlistsCache = { value: collected, fetchedAt: Date.now() };
      setPlaylists(collected);
      setLoading(false);
    };

    fetchAll().catch((err: unknown) => {
      if ((err as Error)?.name === 'AbortError') return;
      if (err instanceof ZodError) {
        setError('Spotify returned an unexpected playlists payload.');
      } else {
        setError(getErrorMessage(err, 'Failed to load playlists'));
      }
      setLoading(false);
    });

    return () => ctrl.abort();
  }, [status, accessToken, request, getErrorMessage, tick]);

  const fetchTracks = useCallback(
    (playlistId: string) => {
      syncCacheScope(accessToken);

      if (status !== 'authenticated' || !accessToken) return;
      // Only skip if tracks already loaded successfully OR currently in flight.
      // A previous error (tracksError set) allows retry — tap again re-fetches.
      if (tracks[playlistId]) return;
      if (tracksLoading[playlistId]) return;

      const cachedTracks = tracksCache.get(playlistId);
      if (cachedTracks) {
        setTracks((prev) => ({ ...prev, [playlistId]: cachedTracks }));
        return;
      }

      const ctrl = new AbortController();

      // Clear any previous error before attempting fetch.
      setTracksLoading((prev) => ({ ...prev, [playlistId]: true }));
      setTracksError((prev) => ({ ...prev, [playlistId]: null }));

      const fetchAll = async () => {
        const collected: SpotifyTrackItem[] = [];
        // Feb 2026: endpoint renamed /tracks → /items
        let url: string | null = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/items?limit=50`;

        while (url) {
          const page: TrackPage = await request<TrackPage>(url, {
            signal: ctrl.signal,
            parse: (payload) => TRACK_PAGE_SCHEMA.parse(payload),
          });
          for (const entry of page.items) {
            const t = entry.track;
            // Skip null items (deleted), episodes, local files.
            if (!t) continue;
            if (!t.uri || !t.uri.startsWith('spotify:track:')) continue;
            if (!t.id) continue;
            collected.push({
              id: t.id,
              name: t.name,
              uri: t.uri,
              durationMs: t.duration_ms ?? 0,
              artists: (t.artists ?? []).map((a) => a.name).join(', '),
              albumArtUrl: t.album?.images?.[0]?.url ?? null,
              isPlayable: t.is_playable !== false,
            });
          }
          url = page.next;
        }

        // Only cache on success.
        tracksCache.set(playlistId, collected);
        setTracks((prev) => ({ ...prev, [playlistId]: collected }));
        setTracksLoading((prev) => ({ ...prev, [playlistId]: false }));
      };

      fetchAll().catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        if (err instanceof SpotifyApiError && err.status === 403) {
          setTracksError((prev) => ({
            ...prev,
            [playlistId]: 'Playlist inaccessible — not available in Dev Mode.',
          }));
        } else if (err instanceof ZodError) {
          setTracksError((prev) => ({
            ...prev,
            [playlistId]: 'Spotify returned an unexpected tracks payload.',
          }));
        } else {
          setTracksError((prev) => ({
            ...prev,
            [playlistId]: getErrorMessage(err, 'Failed to load tracks'),
          }));
        }
        setTracksLoading((prev) => ({ ...prev, [playlistId]: false }));
      });
    },
    [status, accessToken, tracksLoading, tracks, request, getErrorMessage],
  );

  return { playlists, loading, error, tracks, tracksLoading, tracksError, fetchTracks, reload };
}

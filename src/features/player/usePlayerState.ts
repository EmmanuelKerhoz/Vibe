/**
 * usePlayerState
 *
 * Manages the entire player lifecycle:
 * - Audio playback via HTMLAudioElement + Web Audio API analyser node
 * - Track navigation (prev / next / select)
 * - Progress scrubbing
 * - Volume control
 * - AudioProtocol filter (wav | mp3 | all)
 * - Pattern match filter (filename substring)
 * - Mission memo persistence via localStorage (auto-relink on mount)
 * - Duration metadata fill after canplaythrough
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Track, AudioProtocol, PlayerStatus } from './types';
import { safeGetItem, safeSetItem } from '../../utils/safeStorage';

// ──────────────────────────────────────────────────────────────────────────────
const MEMO_STORAGE_KEY = 'vibe_player_memos';
const VOLUME_KEY = 'vibe_player_volume';
const LAST_TRACK_KEY = 'vibe_player_last_track';

function loadMemos(): Record<string, string> {
  try {
    const raw = safeGetItem(MEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveMemos(memos: Record<string, string>) {
  try { safeSetItem(MEMO_STORAGE_KEY, JSON.stringify(memos)); } catch { /* noop */ }
}

function inferProtocol(url: string): 'wav' | 'mp3' {
  return url.toLowerCase().includes('.wav') ? 'wav' : 'mp3';
}

// Initial seed — tracks re-linked from GCS by the consuming component via `setTracks`.
const EMPTY_TRACKS: Track[] = [];

// ──────────────────────────────────────────────────────────────────────────────
export function usePlayerState(initialTracks: Track[] = EMPTY_TRACKS) {
  const [tracks, setTracksRaw] = useState<Track[]>(() => {
    const memos = loadMemos();
    return initialTracks.map(t => ({
      ...t,
      protocol: inferProtocol(t.url),
      memo: memos[t.id] ?? t.memo,
    }));
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const saved = safeGetItem(LAST_TRACK_KEY);
    if (!saved) return 0;
    const idx = initialTracks.findIndex(t => t.id === saved);
    return idx >= 0 ? idx : 0;
  });

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = safeGetItem(VOLUME_KEY);
    return saved ? Math.min(1, Math.max(0, parseFloat(saved))) : 0.8;
  });
  const [filter, setFilter] = useState<AudioProtocol>('all');
  const [patternMatch, setPatternMatch] = useState('');

  // ── Audio engine refs ──────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // ── Boot audio element ───────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration > 0)
        setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => {
      setStatus('idle');
      setProgress(0);
    };
    const onError = () => setStatus('error');
    const onCanPlay = () => {
      setTracksRaw(prev =>
        prev.map((t, i) =>
          i === currentIndex && audio.duration > 0
            ? { ...t, duration: audio.duration }
            : t,
        ),
      );
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplaythrough', onCanPlay);
    audio.volume = volume;

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplaythrough', onCanPlay);
      audioCtxRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bootstrap Web Audio analyser (lazy, on first play) ─────────────
  const ensureAudioContext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return null;
    if (analyserRef.current) return analyserRef.current;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;        // 1024 bins — 80 bands used by visualiser
    analyser.smoothingTimeConstant = 0.78;
    const source = ctx.createMediaElementSource(audio);
    sourceRef.current = source;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    return analyser;
  }, []);

  // ── Load track into audio element ────────────────────────────────
  const loadTrack = useCallback((index: number, autoplay = false) => {
    const audio = audioRef.current;
    const track = tracks[index];
    if (!audio || !track) return;
    audio.pause();
    audio.src = track.url;
    audio.load();
    setCurrentIndex(index);
    setProgress(0);
    setStatus('loading');
    safeSetItem(LAST_TRACK_KEY, track.id);
    if (autoplay) {
      const onCanPlay = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        ensureAudioContext();
        audioCtxRef.current?.resume();
        audio.play().then(() => setStatus('playing')).catch(() => setStatus('error'));
      };
      audio.addEventListener('canplaythrough', onCanPlay);
    }
  }, [tracks, ensureAudioContext]);

  // ── Transport controls ────────────────────────────────────────────
  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src && tracks.length > 0) {
      loadTrack(currentIndex, true);
      return;
    }
    ensureAudioContext();
    audioCtxRef.current?.resume();
    audio.play().then(() => setStatus('playing')).catch(() => setStatus('error'));
  }, [tracks, currentIndex, loadTrack, ensureAudioContext]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus('paused');
  }, []);

  const togglePlay = useCallback(() => {
    if (status === 'playing') pause(); else play();
  }, [status, play, pause]);

  const prev = useCallback(() => {
    const idx = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
    loadTrack(idx, status === 'playing');
  }, [currentIndex, tracks.length, status, loadTrack]);

  const next = useCallback(() => {
    const idx = (currentIndex + 1) % tracks.length;
    loadTrack(idx, status === 'playing');
  }, [currentIndex, tracks.length, status, loadTrack]);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    if (audioRef.current) audioRef.current.volume = clamped;
    setVolumeState(clamped);
    try { safeSetItem(VOLUME_KEY, String(clamped)); } catch { /* noop */ }
  }, []);

  // ── Track list mutations ──────────────────────────────────────────
  const setTracks = useCallback((incoming: Track[]) => {
    const memos = loadMemos();
    setTracksRaw(incoming.map(t => ({
      ...t,
      protocol: inferProtocol(t.url),
      memo: memos[t.id] ?? t.memo,
    })));
  }, []);

  // ── Mission memo persistence ────────────────────────────────────
  const updateMemo = useCallback((trackId: string, memo: string) => {
    setTracksRaw(prev => {
      const next = prev.map(t => t.id === trackId ? { ...t, memo } : t);
      const memos: Record<string, string> = {};
      next.forEach(t => { if (t.memo) memos[t.id] = t.memo; });
      saveMemos(memos);
      return next;
    });
  }, []);

  // ── Filtered track list (for sidebar display) ─────────────────────
  const visibleTracks = useMemo(() => {
    const pattern = patternMatch.toLowerCase();
    return tracks.filter(t => {
      const protocolOk = filter === 'all' || t.protocol === filter;
      const matchOk = !pattern || t.title.toLowerCase().includes(pattern);
      return protocolOk && matchOk;
    });
  }, [tracks, filter, patternMatch]);

  const currentTrack = tracks[currentIndex] ?? null;

  return {
    // State
    tracks,
    visibleTracks,
    currentTrack,
    currentIndex,
    status,
    progress,
    volume,
    filter,
    patternMatch,
    // Refs (for visualiser)
    analyserRef,
    audioCtxRef,
    // Actions
    setTracks,
    loadTrack,
    togglePlay,
    play,
    pause,
    prev,
    next,
    seek,
    setVolume,
    setFilter,
    setPatternMatch,
    updateMemo,
  };
}

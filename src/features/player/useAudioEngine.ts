import { useRef, useState, useCallback, useEffect } from 'react';
import type { TrackEntry } from './types';

export type RepeatMode = 'none' | 'one' | 'all';

export interface TrackInfo {
  channels: number | null;
  sampleRate: number | null;
  bitrateKbps: number | null;
  channelLabel: string;
  codec: string | null;
  isVideo: boolean;
}

export interface AudioEngineState {
  audioRef: React.RefObject<HTMLMediaElement>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeat: RepeatMode;
  shuffle: boolean;
  autoplay: boolean;
  crossfadeMs: number;
  sleepTimerEnd: number | null;
  trackInfo: TrackInfo | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  loadTrack: (track: TrackEntry) => void;
  beep: (freq?: number, type?: OscillatorType, duration?: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleAutoplay: () => void;
  setCrossfadeMs: (ms: number) => void;
  setSleepTimer: (ms: number | null) => void;
  onTrackEnded?: () => void;
  setOnTrackEnded: (cb: (() => void) | undefined) => void;
  attachVideoElement: (el: HTMLVideoElement | null) => void;
}

function channelLabel(n: number): string {
  if (n === 1) return 'MONO';
  if (n === 2) return 'STEREO';
  if (n === 6) return '5.1 SURROUND';
  if (n === 8) return '7.1 SURROUND';
  return `${n}CH`;
}

function codecFromTitle(title: string): string | null {
  const ext = title.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':  return 'MP3';
    case 'wav':  return 'PCM/WAV';
    case 'flac': return 'FLAC';
    case 'ogg':  return 'Vorbis/OGG';
    case 'aac':  return 'AAC';
    case 'm4a':  return 'AAC/M4A';
    case 'opus': return 'OPUS';
    case 'mp4':  return 'H.264+AAC';
    case 'webm': return 'VP9+Opus';
    case 'mov':  return 'H.264/MOV';
    case 'mkv':  return 'MKV';
    default:     return ext ? ext.toUpperCase() : null;
  }
}

async function probeAudioFile(
  url: string,
  fileSizeBytes: number | null,
  duration: number,
): Promise<Partial<TrackInfo>> {
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const AudioCtx = window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return {};
    const ctx = new AudioCtx();
    const decoded = await ctx.decodeAudioData(buf);
    await ctx.close();
    const ch = decoded.numberOfChannels;
    const sr = decoded.sampleRate;
    const size = fileSizeBytes ?? buf.byteLength;
    const bitrate = duration > 0 ? Math.round((size * 8) / duration / 1000) : null;
    return { channels: ch, sampleRate: sr, bitrateKbps: bitrate, channelLabel: channelLabel(ch), isVideo: false };
  } catch {
    return {};
  }
}

export function useAudioEngine(): AudioEngineState {
  const internalAudioRef = useRef<HTMLAudioElement>(new Audio());
  const activeMediaRef = useRef<HTMLMediaElement>(internalAudioRef.current);
  const audioRef = useRef<HTMLMediaElement>(internalAudioRef.current);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [repeat, setRepeat] = useState<RepeatMode>('none');
  const [shuffle, setShuffle] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [crossfadeMs, setCrossfadeMsState] = useState(0);
  const [sleepTimerEnd, setSleepTimerEndState] = useState<number | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);

  const repeatRef = useRef<RepeatMode>('none');
  const onTrackEndedRef = useRef<(() => void) | undefined>(undefined);
  const setOnTrackEnded = useCallback((cb: (() => void) | undefined) => { onTrackEndedRef.current = cb; }, []);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  // ── Sleep timer ──────────────────────────────────────────────────────────
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSleepTimer = useCallback((ms: number | null) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (ms === null) {
      setSleepTimerEndState(null);
      return;
    }
    const end = Date.now() + ms;
    setSleepTimerEndState(end);
    sleepTimerRef.current = setTimeout(() => {
      internalAudioRef.current.pause();
      activeMediaRef.current.pause();
      setSleepTimerEndState(null);
    }, ms);
  }, []);

  useEffect(() => () => { if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current); }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const boundEl = useRef<HTMLMediaElement | null>(null);

  const bindListeners = useCallback((el: HTMLMediaElement) => {
    if (boundEl.current === el) return;
    if (boundEl.current) {
      const prev = boundEl.current;
      prev.removeEventListener('timeupdate', onTime);
      prev.removeEventListener('loadedmetadata', onDuration);
      prev.removeEventListener('ended', onEnded);
      prev.removeEventListener('play', onPlay);
      prev.removeEventListener('pause', onPause);
    }
    boundEl.current = el;
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDuration);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onTime(this: HTMLMediaElement) { setCurrentTime(this.currentTime); }
  function onDuration(this: HTMLMediaElement) { setDuration(this.duration || 0); }
  function onPlay() { setIsPlaying(true); }
  function onPause() { setIsPlaying(false); }
  function onEnded(this: HTMLMediaElement) {
    if (repeatRef.current === 'one') {
      this.currentTime = 0;
      this.play().catch(() => {});
    } else {
      onTrackEndedRef.current?.();
    }
  }

  useEffect(() => {
    bindListeners(internalAudioRef.current);
    return () => {
      const el = boundEl.current;
      if (el) {
        el.removeEventListener('timeupdate', onTime);
        el.removeEventListener('loadedmetadata', onDuration);
        el.removeEventListener('ended', onEnded);
        el.removeEventListener('play', onPlay);
        el.removeEventListener('pause', onPause);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attachVideoElement = useCallback((el: HTMLVideoElement | null) => {
    if (!el) {
      activeMediaRef.current = internalAudioRef.current;
      audioRef.current = internalAudioRef.current;
      bindListeners(internalAudioRef.current);
      return;
    }
    activeMediaRef.current = el;
    audioRef.current = el;
    el.volume = volume;
    bindListeners(el);

    const onMeta = () => {
      const src = el.currentSrc || el.src || '';
      const fileName = src.split('/').pop()?.split('?')[0] ?? '';
      const codec = codecFromTitle(fileName);
      const ch = (el as HTMLVideoElement & { audioTracks?: { length: number } }).audioTracks?.length ?? null;
      setTrackInfo(prev => ({
        channels: ch,
        sampleRate: null,
        bitrateKbps: null,
        channelLabel: ch ? channelLabel(ch) : 'VIDEO',
        codec: codec ?? 'VIDEO',
        isVideo: true,
        ...prev,
      }));
    };
    el.addEventListener('loadedmetadata', onMeta, { once: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  const play = useCallback(() => { activeMediaRef.current.play().catch(() => {}); }, []);
  const pause = useCallback(() => { activeMediaRef.current.pause(); }, []);
  const togglePlay = useCallback(() => {
    if (activeMediaRef.current.paused) activeMediaRef.current.play().catch(() => {});
    else activeMediaRef.current.pause();
  }, []);

  const seek = useCallback((t: number) => {
    activeMediaRef.current.currentTime = t;
    internalAudioRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    internalAudioRef.current.volume = clamped;
    activeMediaRef.current.volume = clamped;
    setVolumeState(clamped);
  }, []);

  const loadTrack = useCallback((track: TrackEntry) => {
    const url = track.url;
    internalAudioRef.current.src = url;
    internalAudioRef.current.load();
    setTrackInfo(null);
    const ext = (track.title ?? url).split('.').pop()?.toLowerCase() ?? '';
    const isVid = ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext);
    if (!isVid) {
      probeAudioFile(url, track.size ?? null, 0).then(info => {
        setTrackInfo({
          channels: info.channels ?? null,
          sampleRate: info.sampleRate ?? null,
          bitrateKbps: info.bitrateKbps ?? null,
          channelLabel: info.channelLabel ?? 'STEREO',
          codec: codecFromTitle(track.title ?? url),
          isVideo: false,
        });
      });
    }
  }, []);

  const toggleRepeat = useCallback(() => { setRepeat(r => r === 'none' ? 'one' : r === 'one' ? 'all' : 'none'); }, []);
  const toggleShuffle = useCallback(() => { setShuffle(s => !s); }, []);
  const toggleAutoplay = useCallback(() => { setAutoplay(a => !a); }, []);
  const setCrossfadeMs = useCallback((ms: number) => { setCrossfadeMsState(Math.max(0, ms)); }, []);

  const beep = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 0.1) => {
    try {
      const AudioCtx = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }, []);

  return {
    audioRef, isPlaying, currentTime, duration, volume,
    repeat, shuffle, autoplay, crossfadeMs, sleepTimerEnd, trackInfo,
    play, pause, togglePlay, seek, setVolume, loadTrack, beep,
    toggleRepeat, toggleShuffle, toggleAutoplay, setCrossfadeMs, setSleepTimer,
    setOnTrackEnded, attachVideoElement,
  };
}

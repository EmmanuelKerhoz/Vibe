import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerControls } from './PlayerControls';
import { PlayerSidebar } from './PlayerSidebar';
import { SidebarProvider } from './SidebarContext';
import { useAudioEngine } from './useAudioEngine';
import { useFrequencyAnalyser } from './useFrequencyAnalyser';
import { useLibraryContext } from '../../contexts/LibraryContext';
import { usePlayerNavigation } from './usePlayerNavigation';
import { useSpotifyAuthState } from '../../contexts/SpotifyAuthContext';
import { useSpotifyEngine_ } from '../../contexts/SpotifyEngineContext';
import { LCARS } from './lcarsTheme';
import { SpotifyPlaylistPanel } from './SpotifyPlaylistPanel';
import { SpotifySearchPanel } from './SpotifySearchPanel';
import { useSpotifyAsEngine } from './useSpotifyAsEngine';
import { ErrorBoundary } from '../../components/app/ErrorBoundary';
import { VoxNovaHeader } from './VoxNovaHeader';
import type { AudioSource } from './VoxNovaHeader';
import { VoxNovaArtwork, VoxNovaFrequencyPanel } from './VoxNovaArtwork';
import { VoxNovaLocalMemo, VoxNovaSpotifyMemo } from './VoxNovaLocalMemo';
import { VoxNovaSeekBar } from './VoxNovaSeekBar';
import { VoxNovaVolumeBar } from './VoxNovaVolumeBar';
import { LCARSBackground, VoxNovaFooter } from './VoxNovaFooter';
import { SPOTIFY_GREEN, LCARS_BOX_COLORS, LIBRARY_CAPACITY } from './playerConstants';

type SpotifyBrowserTab = 'playlists' | 'search';

function isEditableSpaceTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button';
}

// ─── SpotifyBrowserSection ────────────────────────────────────────────────────

function SpotifyBrowserSection({ contentWidth }: { contentWidth: string }) {
  const [browserTab, setBrowserTab] = useState<SpotifyBrowserTab>('playlists');
  return (
    <div style={{ alignSelf: 'center', width: contentWidth, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={() => setBrowserTab('playlists')}
          aria-pressed={browserTab === 'playlists'}
          style={{
            background: browserTab === 'playlists' ? `${SPOTIFY_GREEN}22` : 'transparent',
            color: browserTab === 'playlists' ? SPOTIFY_GREEN : LCARS.subText,
            border: `1px solid ${browserTab === 'playlists' ? `${SPOTIFY_GREEN}66` : `${LCARS.subText}33`}`,
            borderRadius: 3, fontSize: 9, letterSpacing: 2, fontWeight: 700, padding: '4px 8px', cursor: 'pointer',
          }}
        >PLAYLISTS</button>
        <button
          type="button"
          onClick={() => setBrowserTab('search')}
          aria-pressed={browserTab === 'search'}
          style={{
            background: browserTab === 'search' ? `${SPOTIFY_GREEN}22` : 'transparent',
            color: browserTab === 'search' ? SPOTIFY_GREEN : LCARS.subText,
            border: `1px solid ${browserTab === 'search' ? `${SPOTIFY_GREEN}66` : `${LCARS.subText}33`}`,
            borderRadius: 3, fontSize: 9, letterSpacing: 2, fontWeight: 700, padding: '4px 8px', cursor: 'pointer',
          }}
        >SEARCH</button>
      </div>
      <ErrorBoundary label="Spotify browser">
        {browserTab === 'playlists' ? <SpotifyPlaylistPanel /> : <SpotifySearchPanel />}
      </ErrorBoundary>
    </div>
  );
}

// ─── VoxNovaPlayerInner ───────────────────────────────────────────────────────

function VoxNovaPlayerInner() {
  const engine = useAudioEngine();
  const spotifyEngine = useSpotifyAsEngine();
  const { playerState: spotifyPlayerState, playbackState: spotifyPlaybackState, controls: spotifyControls } = useSpotifyEngine_();
  const analyser = useFrequencyAnalyser();
  const library = useLibraryContext();

  const [audioSource, setAudioSource] = useState<AudioSource>('local');

  const { status: spotifyStatus } = useSpotifyAuthState();
  const prevSpotifyStatus = useRef(spotifyStatus);
  useEffect(() => {
    // Auto-switch to Spotify on successful auth; do NOT force back to local on disconnect
    // — VoxNovaSpotifyMemo is always visible and shows CONNECT inline.
    if (prevSpotifyStatus.current !== 'authenticated' && spotifyStatus === 'authenticated') {
      setAudioSource('spotify');
    }
    prevSpotifyStatus.current = spotifyStatus;
  }, [spotifyStatus]);

  const videoElRef = useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    if (selectedId && engine.duration > 0) library.updateDuration(selectedId, engine.duration);
  }, [engine.duration, library, selectedId]);

  const handlePurge = () => {
    if (typeof window !== 'undefined' && !window.confirm('Purge all tracks from local cache?')) return;
    library.purgeAll(); setSelectedId(null); engine.pause();
  };

  const isSpotify = audioSource === 'spotify';
  const activeEngine = isSpotify ? spotifyEngine : engine;

  const spotifyTrack = spotifyPlaybackState?.track_window?.current_track;
  const spotifyArtists = (spotifyTrack?.artists ?? []).map(a => a.name).join(', ');
  const spotifyAlbumArt = spotifyTrack?.album?.images?.[0]?.url ?? null;

  const hasActiveTrack = isSpotify ? !!spotifyTrack : !!selectedTrack;

  // Sidebar is hidden while the player is active (playing)
  const sidebarHidden = activeEngine.isPlaying;

  const handleSpacePlayPause = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.code !== 'Space' || isEditableSpaceTarget(event.target)) return;
    if (isSpotify) {
      if (!spotifyTrack) return;
      event.preventDefault();
      spotifyEngine.togglePlay();
    } else {
      if (!selectedTrack) return;
      event.preventDefault();
      engine.togglePlay();
    }
  }, [engine, spotifyEngine, selectedTrack, spotifyTrack, isSpotify]);

  const handlePrevTrack = useCallback(() => {
    if (isSpotify) { void spotifyControls.previousTrack(); return; }
    void handlePrev();
  }, [isSpotify, spotifyControls, handlePrev]);

  const handleNextTrack = useCallback(() => {
    if (isSpotify) { void spotifyControls.nextTrack(); return; }
    void handleNext();
  }, [isSpotify, spotifyControls, handleNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleSpacePlayPause);
    return () => window.removeEventListener('keydown', handleSpacePlayPause);
  }, [handleSpacePlayPause]);

  const structuralIntegrity = isSpotify
    ? (hasActiveTrack ? 1 : 0)
    : Math.min(1, library.tracks.length / LIBRARY_CAPACITY);
  const neuralBuffer = activeEngine.duration > 0 ? Math.min(1, activeEngine.currentTime / activeEngine.duration) : 0;
  const memo = selectedTrack?.memo || (selectedTrack ? `[LCARS_SCAN] Identified: ${selectedTrack.title} | Integrity: Nominal` : '[LCARS_SCAN] Standby — awaiting signal selection.');
  const title = isSpotify
    ? (spotifyTrack?.name ?? 'Subspace Channel Idle')
    : (selectedTrack?.title ?? 'Subspace Channel Idle');
  const CONTENT_WIDTH = 'min(680px, 95%)';
  const WIDE_WIDTH = 'min(900px, 98%)';

  const lyriaCount = library.tracks.filter(t => t.source === 'lyria').length;
  const prevLyriaCount = useRef(lyriaCount);
  useEffect(() => { if (lyriaCount > prevLyriaCount.current) setView('lyria'); prevLyriaCount.current = lyriaCount; }, [lyriaCount, setView]);

  return (
    <div className="lcars-lyrics-area" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', color: 'var(--text-primary)', fontFamily: '"Antonio", "Eurostile", "Helvetica Neue", Arial, sans-serif', overflow: 'hidden' }}>
      <LCARSBackground />
      <SidebarProvider onLocalTracksAdded={() => setView('local')}>
        {/* Sidebar hidden (not unmounted) while player is active — preserves refs and state */}
        <div
          aria-hidden={sidebarHidden}
          style={{
            display: sidebarHidden ? 'none' : 'contents',
            transition: 'width 280ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <PlayerSidebar
            view={view} setView={setView} tracks={library.tracks}
            selectedId={selectedId} onSelect={handleSelect} onPurge={handlePurge}
          />
        </div>
      </SidebarProvider>

      <main style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, padding: '12px 16px 16px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <VoxNovaHeader
          audioSource={audioSource}
          onAudioSourceChange={setAudioSource}
          isSpotify={isSpotify}
          structuralIntegrity={structuralIntegrity}
          neuralBuffer={neuralBuffer}
        />

        {/* Stage */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 20, padding: '12px 24px 16px 24px', overflow: 'auto' }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ color: LCARS.subText, fontSize: 12, letterSpacing: 4, textTransform: 'uppercase' }}>COMMS_ENCRYPTION: LEVEL 5</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700, textAlign: 'center', letterSpacing: 1, lineHeight: 1.05, textShadow: '0 0 32px rgba(255,255,255,0.25)', maxWidth: WIDE_WIDTH }}>{title}</h1>
            <div style={{ width: 120, height: 3, background: isSpotify ? SPOTIFY_GREEN : LCARS.peach, borderRadius: 2 }} aria-hidden="true" />
          </div>

          {/* MEMO LOG — local always shown; Spotify log always shown below (contains CONNECT button) */}
          {!isSpotify && (
            <VoxNovaLocalMemo
              contentWidth={CONTENT_WIDTH}
              memo={memo}
              selectedTrack={selectedTrack}
              trackInfo={engine.trackInfo}
              duration={engine.duration}
            />
          )}

          {/* Spotify memo log — always rendered; shows CONNECT when not authenticated */}
          <VoxNovaSpotifyMemo
            contentWidth={CONTENT_WIDTH}
            playerState={spotifyPlayerState}
            track={spotifyTrack}
          />

          {/* Video / Album-art stage */}
          <VoxNovaArtwork
            isSpotify={isSpotify}
            contentWidth={CONTENT_WIDTH}
            isPlaying={activeEngine.isPlaying}
            videoSrc={!isSpotify && selectedTrack?.isVideo ? selectedTrack.url : undefined}
            videoRef={!isSpotify && selectedTrack?.isVideo ? videoElRef : undefined}
            spotifyImageUrl={spotifyAlbumArt ?? undefined}
            spotifyTrackName={spotifyTrack?.name}
            spotifyArtistsLabel={spotifyArtists}
          />

          {/* Transport */}
          <div style={{ alignSelf: 'center', width: CONTENT_WIDTH,
            border: `1px solid ${isSpotify ? `${SPOTIFY_GREEN}55` : `${LCARS.peach}33`}`,
            borderRadius: 4, padding: '12px 16px',
            background: isSpotify ? 'rgba(29,185,84,0.06)' : LCARS_BOX_COLORS[2],
            display: 'flex', flexDirection: 'column', gap: 10 }}>
            <VoxNovaSeekBar currentTime={activeEngine.currentTime} duration={activeEngine.duration} onSeek={activeEngine.seek} disabled={!hasActiveTrack} />
            <PlayerControls engine={activeEngine} onPrev={handlePrevTrack} onNext={handleNextTrack} disabled={!hasActiveTrack} />
            <VoxNovaVolumeBar volume={activeEngine.volume} onChange={activeEngine.setVolume} />
          </div>

          <div style={{ flex: 1, minHeight: 0 }} aria-hidden="true" />

          {/* Frequency scan */}
          {!isSpotify && selectedTrack && (
            <VoxNovaFrequencyPanel
              wideWidth={WIDE_WIDTH}
              isVideo={selectedTrack.isVideo}
              isPlaying={engine.isPlaying}
              analyser={analyser}
              audioRef={engine.audioRef}
            />
          )}

          {/* Singularity status */}
          <VoxNovaFooter
            isPlaying={activeEngine.isPlaying}
            analyser={analyser}
            wideWidth={WIDE_WIDTH}
          />

          {/* Spotify browser — only when authenticated and in spotify mode */}
          {isSpotify && spotifyStatus === 'authenticated' && (
            <SpotifyBrowserSection contentWidth={CONTENT_WIDTH} />
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Public entry point. Wraps the whole player — including the audio-engine
 * hooks and their derived UI — in an ErrorBoundary so an uncaught failure in
 * the engine degrades gracefully instead of taking down the entire app shell.
 */
export function VoxNovaPlayer() {
  return (
    <ErrorBoundary label="Audio player">
      <VoxNovaPlayerInner />
    </ErrorBoundary>
  );
}

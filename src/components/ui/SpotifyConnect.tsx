/**
 * SpotifyConnect — Fluent 2 Spotify integration widget.
 * Shows connect button when unauthenticated, full player controls when ready.
 */
import React, { useCallback } from 'react';
import {
  Button as FluentButton,
  Badge,
  Slider,
  type SliderOnChangeData,
  Text,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  MusicNote220Regular,
  PlayCircle20Regular,
  PauseCircle20Regular,
  Next20Regular,
  Previous20Regular,
  Speaker220Regular,
  PlugDisconnected20Regular,
} from '@fluentui/react-icons';
import { useSpotifyAuth } from '../../hooks/audio/useSpotifyAuth';
import { useSpotifyPlayer } from '../../hooks/audio/useSpotifyPlayer';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    minWidth: '280px',
    maxWidth: '360px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  trackInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    overflow: 'hidden',
  },
  artwork: {
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusSmall,
    objectFit: 'cover',
    flexShrink: 0,
  },
  artworkPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackText: {
    overflow: 'hidden',
    flex: 1,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    justifyContent: 'center',
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  volumeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  slider: {
    flex: 1,
  },
  timeLabel: {
    minWidth: '36px',
    textAlign: 'center',
  },
  errorBanner: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
  },
});

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export const SpotifyConnect: React.FC = () => {
  const classes = useStyles();
  const auth = useSpotifyAuth();
  const player = useSpotifyPlayer(auth);

  const handleSeekChange = useCallback(
    (_ev: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
      void player.seek(data.value);
    },
    [player]
  );

  const handleVolumeChange = useCallback(
    (_ev: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
      void player.setVolume(data.value / 100);
    },
    [player]
  );

  // ── Not authenticated ──
  if (!auth.isAuthenticated) {
    return (
      <div className={classes.root}>
        <div className={classes.header}>
          <MusicNote220Regular />
          <Text weight="semibold">Spotify</Text>
        </div>
        {auth.error && <Text className={classes.errorBanner}>{auth.error}</Text>}
        <FluentButton
          appearance="primary"
          icon={<MusicNote220Regular />}
          onClick={() => void auth.login()}
          disabled={auth.isLoading}
        >
          {auth.isLoading ? 'Connexion…' : 'Connecter Spotify'}
        </FluentButton>
      </div>
    );
  }

  // ── Authenticated — SDK initializing ──
  if (!player.isReady) {
    return (
      <div className={classes.root}>
        <div className={classes.header}>
          <MusicNote220Regular />
          <Text weight="semibold">Spotify</Text>
          <Badge color="warning" size="small">Initialisation…</Badge>
        </div>
        {player.error && <Text className={classes.errorBanner}>{player.error}</Text>}
        <FluentButton
          appearance="transparent"
          icon={<PlugDisconnected20Regular />}
          onClick={auth.logout}
          size="small"
        >
          Déconnecter
        </FluentButton>
      </div>
    );
  }

  // ── Player ready ──
  const track = player.currentTrack;
  const artwork = track?.album.images[0]?.url;

  return (
    <div className={classes.root}>
      {/* Header */}
      <div className={classes.header}>
        <MusicNote220Regular />
        <Text weight="semibold">Spotify</Text>
        <Badge color="success" size="small">Actif</Badge>
        <Tooltip content="Déconnecter" relationship="label">
          <FluentButton
            appearance="transparent"
            icon={<PlugDisconnected20Regular />}
            onClick={auth.logout}
            size="small"
            style={{ marginLeft: 'auto' }}
          />
        </Tooltip>
      </div>

      {/* Track info */}
      <div className={classes.trackInfo}>
        {artwork ? (
          <img src={artwork} alt={track?.album.name ?? ''} className={classes.artwork} />
        ) : (
          <div className={classes.artworkPlaceholder}>
            <MusicNote220Regular />
          </div>
        )}
        <div className={classes.trackText}>
          <Text
            weight="semibold"
            style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {track?.name ?? '—'}
          </Text>
          <Text
            size={200}
            style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}
          >
            {track?.artists.map((a) => a.name).join(', ') ?? '—'}
          </Text>
        </div>
      </div>

      {/* Progress */}
      <div className={classes.progressRow}>
        <Text size={100} className={classes.timeLabel}>{formatMs(player.positionMs)}</Text>
        <Slider
          className={classes.slider}
          min={0}
          max={player.durationMs || 1}
          value={player.positionMs}
          onChange={handleSeekChange}
          size="small"
        />
        <Text size={100} className={classes.timeLabel}>{formatMs(player.durationMs)}</Text>
      </div>

      {/* Transport controls */}
      <div className={classes.controls}>
        <Tooltip content="Précédent" relationship="label">
          <FluentButton
            appearance="transparent"
            icon={<Previous20Regular />}
            onClick={() => void player.previousTrack()}
            disabled={Boolean(player.playbackState?.disallows.skipping_prev)}
          />
        </Tooltip>
        <Tooltip content={player.isPlaying ? 'Pause' : 'Lecture'} relationship="label">
          <FluentButton
            appearance="primary"
            icon={player.isPlaying ? <PauseCircle20Regular /> : <PlayCircle20Regular />}
            onClick={() => void player.togglePlay()}
          />
        </Tooltip>
        <Tooltip content="Suivant" relationship="label">
          <FluentButton
            appearance="transparent"
            icon={<Next20Regular />}
            onClick={() => void player.nextTrack()}
            disabled={Boolean(player.playbackState?.disallows.skipping_next)}
          />
        </Tooltip>
      </div>

      {/* Volume */}
      <div className={classes.volumeRow}>
        <Speaker220Regular style={{ flexShrink: 0 }} />
        <Slider
          className={classes.slider}
          min={0}
          max={100}
          value={Math.round(player.volume * 100)}
          onChange={handleVolumeChange}
          size="small"
        />
      </div>

      {player.error && <Text className={classes.errorBanner}>{player.error}</Text>}
    </div>
  );
};

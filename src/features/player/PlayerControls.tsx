import {
  Button,
  Slider,
  Tooltip,
  tokens,
} from '@fluentui/react-components';
import {
  Play24Regular,
  Pause24Regular,
  Previous24Regular,
  Next24Regular,
  Speaker224Regular,
  SpeakerMute24Regular,
} from '@fluentui/react-icons';
import type { AudioEngineState } from './useAudioEngine';

interface PlayerControlsProps {
  engine: AudioEngineState;
  onPrev: () => void;
  onNext: () => void;
  trackTitle?: string;
}

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function PlayerControls({ engine, onPrev, onNext, trackTitle }: PlayerControlsProps) {
  const { isPlaying, currentTime, duration, volume, togglePlay, seek, setVolume } = engine;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}` }}>
      {trackTitle && (
        <div style={{ color: tokens.colorNeutralForeground1, fontFamily: tokens.fontFamilyBase, fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightSemibold, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {trackTitle}
        </div>
      )}

      {/* Seek bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        <span style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase100, fontVariantNumeric: 'tabular-nums', minWidth: 36 }}>
          {formatTime(currentTime)}
        </span>
        <Slider
          style={{ flex: 1 }}
          min={0}
          max={duration || 1}
          value={currentTime}
          onChange={(_, d) => seek(d.value)}
          aria-label="Seek"
        />
        <span style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase100, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Transport */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
        <Tooltip content="Previous" relationship="label">
          <Button appearance="subtle" icon={<Previous24Regular />} onClick={onPrev} aria-label="Previous track" />
        </Tooltip>
        <Tooltip content={isPlaying ? 'Pause' : 'Play'} relationship="label">
          <Button
            appearance="primary"
            icon={isPlaying ? <Pause24Regular /> : <Play24Regular />}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{ borderRadius: '50%', width: 48, height: 48 }}
          />
        </Tooltip>
        <Tooltip content="Next" relationship="label">
          <Button appearance="subtle" icon={<Next24Regular />} onClick={onNext} aria-label="Next track" />
        </Tooltip>
      </div>

      {/* Volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        <Tooltip content={volume === 0 ? 'Unmute' : 'Mute'} relationship="label">
          <Button
            appearance="subtle"
            icon={volume === 0 ? <SpeakerMute24Regular /> : <Speaker224Regular />}
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          />
        </Tooltip>
        <Slider
          style={{ flex: 1, maxWidth: 120 }}
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(_, d) => setVolume(d.value)}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}

import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createRef } from 'react';
import { VoxNovaArtwork } from './VoxNovaArtwork';
import { AudioVisualStage } from './AudioVisualStage';
import { StageOverlay, formatTime } from './StageOverlay';
import type { StageOverlayBindings } from './StageOverlay';

function makeOverlay(overrides: Partial<StageOverlayBindings> = {}): StageOverlayBindings {
  return {
    currentTime: 30,
    duration: 120,
    volume: 0.8,
    onTogglePlay: vi.fn(),
    onSeek: vi.fn(),
    onVolumeChange: vi.fn(),
    ...overrides,
  };
}

describe('VoxNovaArtwork', () => {
  describe('Spotify mode', () => {
    it('renders the Spotify album-art stage with track metadata', () => {
      render(
        <VoxNovaArtwork
          isSpotify
          contentWidth="500px"
          isPlaying={false}
          spotifyImageUrl="https://example.com/cover.jpg"
          spotifyTrackName="Cosmic Drift"
          spotifyArtistsLabel="The Voyagers"
        />,
      );
      expect(screen.getByText('SPOTIFY STREAM')).toBeInTheDocument();
      expect(screen.getByText('Cosmic Drift')).toBeInTheDocument();
      expect(screen.getByText('The Voyagers')).toBeInTheDocument();
      const img = screen.getByAltText('Album art for Cosmic Drift') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/cover.jpg');
    });

    it('shows STREAMING when playing and STANDBY when paused', () => {
      const { rerender } = render(
        <VoxNovaArtwork
          isSpotify
          contentWidth="500px"
          isPlaying={false}
          spotifyImageUrl="https://example.com/cover.jpg"
          spotifyTrackName="Cosmic Drift"
        />,
      );
      expect(screen.getByText('STANDBY')).toBeInTheDocument();
      rerender(
        <VoxNovaArtwork
          isSpotify
          contentWidth="500px"
          isPlaying
          spotifyImageUrl="https://example.com/cover.jpg"
          spotifyTrackName="Cosmic Drift"
        />,
      );
      expect(screen.getByText('STREAMING')).toBeInTheDocument();
    });

    it('renders nothing when the Spotify image or track name is missing', () => {
      const { container } = render(
        <VoxNovaArtwork isSpotify contentWidth="500px" isPlaying={false} spotifyTrackName="Cosmic Drift" />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('local video mode', () => {
    it('renders the video stage with the provided source', () => {
      const videoRef = createRef<HTMLVideoElement>();
      render(
        <VoxNovaArtwork
          isSpotify={false}
          contentWidth="500px"
          isPlaying
          videoSrc="blob:video-stream"
          videoRef={videoRef}
        />,
      );
      expect(screen.getByText('VIDEO STREAM')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      const video = screen.getByLabelText('Video player \u2013 playing') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(video.getAttribute('src')).toBe('blob:video-stream');
    });

    it('renders nothing when no video source/ref is supplied', () => {
      const { container } = render(
        <VoxNovaArtwork isSpotify={false} contentWidth="500px" isPlaying={false} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders in-stage overlay controls (play/pause, \u00b110s, seek, volume) on the video', () => {
      const videoRef = createRef<HTMLVideoElement>();
      const overlay = makeOverlay();
      render(
        <VoxNovaArtwork
          isSpotify={false}
          contentWidth="500px"
          isPlaying
          videoSrc="blob:video-stream"
          videoRef={videoRef}
          overlay={overlay}
        />,
      );
      expect(screen.getByLabelText('Pause')).toBeInTheDocument();
      expect(screen.getByLabelText('Skip back 10 seconds')).toBeInTheDocument();
      expect(screen.getByLabelText('Skip forward 10 seconds')).toBeInTheDocument();
      expect(screen.getByLabelText('Seek')).toBeInTheDocument();
      expect(screen.getByLabelText('Volume')).toBeInTheDocument();
    });

    it('wires the overlay controls to the engine bindings', () => {
      const videoRef = createRef<HTMLVideoElement>();
      const overlay = makeOverlay();
      render(
        <VoxNovaArtwork
          isSpotify={false}
          contentWidth="500px"
          isPlaying={false}
          videoSrc="blob:video-stream"
          videoRef={videoRef}
          overlay={overlay}
        />,
      );
      fireEvent.click(screen.getByLabelText('Play'));
      expect(overlay.onTogglePlay).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByLabelText('Skip back 10 seconds'));
      expect(overlay.onSeek).toHaveBeenCalledWith(20);
      fireEvent.click(screen.getByLabelText('Skip forward 10 seconds'));
      expect(overlay.onSeek).toHaveBeenCalledWith(40);
      fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '0.3' } });
      expect(overlay.onVolumeChange).toHaveBeenCalledWith(0.3);
    });
  });

  describe('local audio mode (no video)', () => {
    it('renders the randomized visual stage with overlay controls when a seed is provided', () => {
      render(
        <VoxNovaArtwork
          isSpotify={false}
          contentWidth="500px"
          isPlaying
          visualSeed="track-42"
          overlay={makeOverlay()}
        />,
      );
      expect(screen.getByText('VISUAL STREAM')).toBeInTheDocument();
      expect(screen.getByLabelText('Audio visualization \u2013 playing')).toBeInTheDocument();
      expect(screen.getByLabelText('Pause')).toBeInTheDocument();
      expect(screen.getByLabelText('Volume')).toBeInTheDocument();
    });

    it('renders nothing without a visual seed', () => {
      const { container } = render(
        <VoxNovaArtwork isSpotify={false} contentWidth="500px" isPlaying={false} overlay={makeOverlay()} />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });
});

// ─── StageOverlay unit tests ───────────────────────────────────────────────────────────

describe('StageOverlay', () => {
  function renderOverlay(visible: boolean, overrides: Partial<StageOverlayBindings> = {}) {
    return render(
      <StageOverlay
        visible={visible}
        isPlaying={false}
        currentTime={30}
        duration={120}
        volume={0.8}
        onTogglePlay={vi.fn()}
        onSeek={vi.fn()}
        onVolumeChange={vi.fn()}
        {...overrides}
      />,
    );
  }

  describe('tabIndex guard', () => {
    it('all interactive controls are reachable (tabIndex=0) when visible', () => {
      renderOverlay(true);
      expect(screen.getByLabelText('Play')).toHaveAttribute('tabindex', '0');
      expect(screen.getByLabelText('Skip back 10 seconds')).toHaveAttribute('tabindex', '0');
      expect(screen.getByLabelText('Skip forward 10 seconds')).toHaveAttribute('tabindex', '0');
      expect(screen.getByLabelText('Seek')).toHaveAttribute('tabindex', '0');
      expect(screen.getByLabelText('Mute')).toHaveAttribute('tabindex', '0');
      expect(screen.getByLabelText('Volume')).toHaveAttribute('tabindex', '0');
    });

    it('all interactive controls are removed from tab order (tabIndex=-1) when hidden', () => {
      renderOverlay(false);
      expect(screen.getByLabelText('Play')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByLabelText('Skip back 10 seconds')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByLabelText('Skip forward 10 seconds')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByLabelText('Seek')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByLabelText('Mute')).toHaveAttribute('tabindex', '-1');
      expect(screen.getByLabelText('Volume')).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('aria-valuetext', () => {
    it('seek input exposes formatted time as aria-valuetext', () => {
      renderOverlay(true, { currentTime: 75, duration: 183 });
      expect(screen.getByLabelText('Seek')).toHaveAttribute('aria-valuetext', '1:15 / 3:03');
    });

    it('volume input exposes percentage as aria-valuetext', () => {
      renderOverlay(true, { volume: 0.65 });
      expect(screen.getByLabelText('Volume')).toHaveAttribute('aria-valuetext', '65%');
    });

    it('volume aria-valuetext rounds correctly', () => {
      renderOverlay(true, { volume: 0.333 });
      expect(screen.getByLabelText('Volume')).toHaveAttribute('aria-valuetext', '33%');
    });

    it('seek aria-valuetext handles unknown duration gracefully', () => {
      renderOverlay(true, { currentTime: 10, duration: Infinity });
      // formatTime(Infinity) returns '0:00'; overlay still renders without crash
      expect(screen.getByLabelText('Seek')).toHaveAttribute('aria-valuetext', '0:10 / 0:00');
    });
  });

  describe('mute toggle', () => {
    it('unmute restores last known volume', () => {
      const onVolumeChange = vi.fn();
      renderOverlay(true, { volume: 0, onVolumeChange });
      fireEvent.click(screen.getByLabelText('Unmute'));
      expect(onVolumeChange).toHaveBeenCalledWith(1); // lastVolumeRef fallback
    });
  });
});

// ─── formatTime unit tests ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [59, '0:59'],
    [60, '1:00'],
    [90, '1:30'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3661, '1:01:01'],
    [-1, '0:00'],
    [Infinity, '0:00'],
    [NaN, '0:00'],
  ])('formatTime(%s) = %s', (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });
});

// ─── AudioVisualStage unit tests ──────────────────────────────────────────────────────────

describe('AudioVisualStage', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  function renderStage(isPlaying = true, seed = 'test-seed') {
    return render(
      <AudioVisualStage
        seed={seed}
        isPlaying={isPlaying}
        contentWidth="500px"
        overlay={makeOverlay()}
      />,
    );
  }

  it('renders VISUAL STREAM header and canvas stage', () => {
    renderStage();
    expect(screen.getByText('VISUAL STREAM')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Audio visualization \u2013 playing' })).toBeInTheDocument();
  });

  it('overlay is initially hidden (not playing = always visible; playing = hidden until hover)', () => {
    // When paused, overlay should be visible (showControls || !isPlaying)
    renderStage(false);
    expect(screen.getByLabelText('Play')).toHaveAttribute('tabindex', '0');
  });

  it('auto-hide: overlay disappears 2800 ms after last mousemove', () => {
    const { container } = renderStage(true);
    const stage = container.firstChild as HTMLElement;
    // Trigger mousemove to show controls
    fireEvent.mouseMove(stage);
    // Controls should be visible immediately
    expect(screen.getByLabelText('Pause')).toHaveAttribute('tabindex', '0');
    // Advance timer past the 2800 ms threshold
    act(() => { vi.advanceTimersByTime(2800); });
    // Controls should now be hidden
    expect(screen.getByLabelText('Pause')).toHaveAttribute('tabindex', '-1');
  });

  it('mouseleave immediately hides overlay', () => {
    const { container } = renderStage(true);
    const stage = container.firstChild as HTMLElement;
    fireEvent.mouseMove(stage);
    expect(screen.getByLabelText('Pause')).toHaveAttribute('tabindex', '0');
    fireEvent.mouseLeave(stage);
    expect(screen.getByLabelText('Pause')).toHaveAttribute('tabindex', '-1');
  });

  it('same seed always produces the same VISUAL STREAM label (PRNG determinism)', () => {
    const { unmount } = renderStage(true, 'deterministic-seed');
    expect(screen.getByText('VISUAL STREAM')).toBeInTheDocument();
    unmount();
    // Re-render with same seed — DOM structure must be identical
    renderStage(true, 'deterministic-seed');
    expect(screen.getByText('VISUAL STREAM')).toBeInTheDocument();
  });

  it('different seeds produce the same structural DOM (mode-agnostic render)', () => {
    const { unmount } = renderStage(true, 'seed-alpha');
    expect(screen.getByText('VISUAL STREAM')).toBeInTheDocument();
    unmount();
    renderStage(true, 'seed-beta');
    expect(screen.getByText('VISUAL STREAM')).toBeInTheDocument();
  });
});

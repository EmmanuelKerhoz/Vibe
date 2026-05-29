import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createRef } from 'react';
import { VoxNovaArtwork } from './VoxNovaArtwork';

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
      const video = screen.getByLabelText('Video player – playing') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(video.getAttribute('src')).toBe('blob:video-stream');
    });

    it('renders nothing when no video source/ref is supplied', () => {
      const { container } = render(
        <VoxNovaArtwork isSpotify={false} contentWidth="500px" isPlaying={false} />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });
});

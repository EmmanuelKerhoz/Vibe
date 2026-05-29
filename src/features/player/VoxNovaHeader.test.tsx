import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoxNovaHeader } from './VoxNovaHeader';

describe('VoxNovaHeader', () => {
  it('renders the registry banner and the audio-source toggle', () => {
    render(
      <VoxNovaHeader
        audioSource="local"
        onAudioSourceChange={vi.fn()}
        isSpotify={false}
        structuralIntegrity={0.5}
        neuralBuffer={0.2}
      />,
    );
    expect(screen.getByText(/USS VOX NOVA \/\/ REGISTRY/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Audio source' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LOCAL' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'SPOTIFY' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('invokes onAudioSourceChange when a source button is clicked', () => {
    const onAudioSourceChange = vi.fn();
    render(
      <VoxNovaHeader
        audioSource="local"
        onAudioSourceChange={onAudioSourceChange}
        isSpotify={false}
        structuralIntegrity={0.5}
        neuralBuffer={0.2}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SPOTIFY' }));
    expect(onAudioSourceChange).toHaveBeenCalledWith('spotify');
  });

  it('shows the STRUCTURAL INTEGRITY status bar in local mode', () => {
    render(
      <VoxNovaHeader
        audioSource="local"
        onAudioSourceChange={vi.fn()}
        isSpotify={false}
        structuralIntegrity={0.5}
        neuralBuffer={0.2}
      />,
    );
    expect(screen.getByText('STRUCTURAL INTEGRITY')).toBeInTheDocument();
    expect(screen.getByText('NEURAL BUFFER')).toBeInTheDocument();
    expect(screen.getByText('SECTOR TIME')).toBeInTheDocument();
  });

  it('shows the SPOTIFY LINK status bar in Spotify mode', () => {
    render(
      <VoxNovaHeader
        audioSource="spotify"
        onAudioSourceChange={vi.fn()}
        isSpotify
        structuralIntegrity={1}
        neuralBuffer={0.5}
      />,
    );
    expect(screen.getByText('SPOTIFY LINK')).toBeInTheDocument();
    expect(screen.queryByText('STRUCTURAL INTEGRITY')).not.toBeInTheDocument();
  });
});

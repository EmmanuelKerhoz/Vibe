import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SongVersion } from '../../../types';
import { VersionsModal } from './VersionsModal';

vi.mock('../../ui/icons', () => ({
  History: () => null,
  Layout: () => null,
  Plus: () => null,
  Sparkles: () => null,
  Undo2: () => null,
  X: () => null,
}));

const version: SongVersion = {
  id: 'version-1',
  timestamp: 1710000000000,
  song: [{ id: 'section-1', name: 'Verse', lines: [] }],
  structure: ['Verse'],
  title: 'Song title',
  titleOrigin: 'user',
  topic: 'Love',
  mood: 'Warm',
  name: 'Draft 1',
};

describe('VersionsModal', () => {
  const createProps = () => ({
    isOpen: true,
    versions: [] as SongVersion[],
    onClose: vi.fn(),
    onSaveCurrent: vi.fn(),
    onRollback: vi.fn(),
    onRequestVersionName: vi.fn(),
  });

  it('renders nothing when the modal is closed', () => {
    render(<VersionsModal {...createProps()} isOpen={false} />);

    expect(screen.queryByRole('dialog', { name: 'Song Versions' })).toBeNull();
  });

  it('renders the dialog and the empty state when there are no versions', () => {
    render(<VersionsModal {...createProps()} />);

    expect(screen.getByRole('dialog', { name: 'Song Versions' })).toBeTruthy();
    expect(screen.getByText('No versions saved yet.')).toBeTruthy();
  });

  it('requests a version name and saves the current version only when a name is provided', () => {
    const onSaveCurrent = vi.fn();
    const onRequestVersionName = vi.fn((callback: (name: string) => void) => {
      callback('Snapshot A');
      callback('');
    });

    render(
      <VersionsModal
        {...createProps()}
        onSaveCurrent={onSaveCurrent}
        onRequestVersionName={onRequestVersionName}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save Current' }));

    expect(onRequestVersionName).toHaveBeenCalledTimes(1);
    expect(onSaveCurrent).toHaveBeenCalledTimes(1);
    expect(onSaveCurrent).toHaveBeenCalledWith('Snapshot A');
  });

  it('rolls back a saved version and closes from the close action', () => {
    const props = createProps();

    render(<VersionsModal {...props} versions={[version]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rollback' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(props.onRollback).toHaveBeenCalledWith(version);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

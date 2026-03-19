import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { SaveToLibraryModal } from './SaveToLibraryModal';

describe('SaveToLibraryModal', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders load actions for library songs even when there is no current song', () => {
    const onLoadAsset = vi.fn();
    const asset = {
      id: 'asset-1',
      title: 'Saved Song',
      timestamp: 1710000000000,
      type: 'song' as const,
      sections: [],
    };

    render(
      <LanguageProvider>
        <SaveToLibraryModal
          isOpen
          onClose={() => {}}
          onSave={async () => {}}
          onLoadAsset={onLoadAsset}
          isSaving={false}
          currentTitle="Current Song"
          libraryAssets={[asset]}
          hasCurrentSong={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Load: Saved Song' }));

    expect(onLoadAsset).toHaveBeenCalledWith(asset);
    expect(screen.queryByRole('button', { name: 'Save Current Song' })).toBeNull();
  });

  it('renders delete actions for library songs and forwards the asset id', () => {
    const onDeleteAsset = vi.fn();

    render(
      <LanguageProvider>
        <SaveToLibraryModal
          isOpen
          onClose={() => {}}
          onSave={async () => {}}
          onDeleteAsset={onDeleteAsset}
          isSaving={false}
          currentTitle="Current Song"
          libraryAssets={[
            {
              id: 'asset-1',
              title: 'Saved Song',
              timestamp: 1710000000000,
              type: 'song',
              sections: [],
            },
          ]}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByTitle('Remove from library'));

    expect(onDeleteAsset).toHaveBeenCalledWith('asset-1');
  });

  it('shows storage usage for the lyricist_library localStorage entry and a localized scope note', () => {
    localStorage.setItem('lyricist_library', 'x'.repeat(1024 * 1024));

    render(
      <LanguageProvider>
        <SaveToLibraryModal
          isOpen
          onClose={() => {}}
          onSave={async () => {}}
          isSaving={false}
          currentTitle="Current Song"
          libraryAssets={[]}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText('1.0 MB')).toBeTruthy();
    expect(screen.getByText('5.0 MB')).toBeTruthy();
    expect(screen.getByText('20%')).toBeTruthy();
    expect(screen.getByText('Measures only the lyricist_library data stored locally in this browser.')).toBeTruthy();
  });

  it('renders the storage block even when localStorage access fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    render(
      <LanguageProvider>
        <SaveToLibraryModal
          isOpen
          onClose={() => {}}
          onSave={async () => {}}
          isSaving={false}
          currentTitle="Current Song"
          libraryAssets={[]}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText('5.0 MB')).toBeTruthy();
    expect(screen.getByText('Measures only the lyricist_library data stored locally in this browser.')).toBeTruthy();
  });
});

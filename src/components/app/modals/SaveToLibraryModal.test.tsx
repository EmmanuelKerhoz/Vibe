import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { SaveToLibraryModal } from './SaveToLibraryModal';

describe('SaveToLibraryModal', () => {
  const setNavigatorStorageEstimate = (estimate?: () => Promise<{ usage?: number; quota?: number }>) => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: estimate ? { estimate } : {},
    });
  };

  afterEach(() => {
    setNavigatorStorageEstimate();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    setNavigatorStorageEstimate(vi.fn().mockResolvedValue({
      usage: 2 * 1024 * 1024,
      quota: 10 * 1024 * 1024,
    }));
  });

  it('renders load actions for library songs even when there is no current song', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('Library data')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Load: Saved Song' }));

    expect(onLoadAsset).toHaveBeenCalledWith(asset);
    expect(screen.queryByRole('button', { name: 'Save Current Song' })).toBeNull();
  });

  it('renders delete actions for library songs and forwards the asset id', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('Library data')).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle('Remove from library'));

    expect(onDeleteAsset).toHaveBeenCalledWith('asset-1');
  });

  it('shows library data separately from browser storage estimates', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('1.0 MB')).toBeTruthy();
      expect(screen.getByText('2.0 MB')).toBeTruthy();
      expect(screen.getByText('10.0 MB')).toBeTruthy();
      expect(screen.getByText('20%')).toBeTruthy();
    });
    expect(screen.getByText('Library data')).toBeTruthy();
    expect(screen.getByText('Browser usage')).toBeTruthy();
    expect(screen.getByText('Browser limit')).toBeTruthy();
    expect(screen.getByText('Library data covers only lyricist_library. Browser usage and limit are global estimates for this browser when available.')).toBeTruthy();
  });

  it('renders the storage block even when localStorage access fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });
    setNavigatorStorageEstimate();

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

    await waitFor(() => {
      expect(screen.getByText('Library data')).toBeTruthy();
    });
    expect(screen.getByText('Library data')).toBeTruthy();
    expect(screen.queryByText('Browser usage')).toBeNull();
    expect(screen.getByText('Library data covers only lyricist_library. Browser usage and limit are global estimates for this browser when available.')).toBeTruthy();
  });
});

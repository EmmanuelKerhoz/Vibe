import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { SaveToLibraryModal } from './SaveToLibraryModal';

describe('SaveToLibraryModal', () => {
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
});

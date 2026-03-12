import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { SaveToLibraryModal } from './SaveToLibraryModal';

describe('SaveToLibraryModal', () => {
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

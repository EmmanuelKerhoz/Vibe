import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { ImportModal } from './ImportModal';

describe('ImportModal', () => {
  it('offers both file loading and pasted lyrics entry points', () => {
    const onChooseFile = vi.fn();
    const onOpenLibrary = vi.fn();
    const onPasteLyrics = vi.fn();

    render(
      <LanguageProvider>
        <ImportModal
          isOpen
          hasExistingWork={false}
          canPasteLyrics={true}
          onClose={() => {}}
          onOpenLibrary={onOpenLibrary}
          onChooseFile={onChooseFile}
          onPasteLyrics={onPasteLyrics}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    fireEvent.click(screen.getByRole('button', { name: 'Paste Lyrics' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose file' }));

    expect(onOpenLibrary).toHaveBeenCalledTimes(1);
    expect(onPasteLyrics).toHaveBeenCalledTimes(1);
    expect(onChooseFile).toHaveBeenCalledTimes(1);
  });

  it('disables the paste action when there is no text available to paste', () => {
    render(
      <LanguageProvider>
        <ImportModal
          isOpen
          hasExistingWork={false}
          canPasteLyrics={false}
          onClose={() => {}}
          onOpenLibrary={() => {}}
          onChooseFile={() => {}}
          onPasteLyrics={() => {}}
        />
      </LanguageProvider>,
    );

    expect((screen.getByRole('button', { name: 'Paste Lyrics' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

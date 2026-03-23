import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

describe('KeyboardShortcutsModal', () => {
  it('renders the grouped shortcut reference when open', () => {
    render(
      <LanguageProvider>
        <KeyboardShortcutsModal isOpen onClose={() => {}} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeTruthy();
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Navigation')).toBeTruthy();
    expect(screen.getByText('File')).toBeTruthy();
    expect(screen.getByText('AI')).toBeTruthy();
    expect(screen.getByText('Undo the latest change outside text inputs.')).toBeTruthy();
  });

  it('closes from both close actions', () => {
    const onClose = vi.fn();

    render(
      <LanguageProvider>
        <KeyboardShortcutsModal isOpen onClose={onClose} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]!);
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[1]!);

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

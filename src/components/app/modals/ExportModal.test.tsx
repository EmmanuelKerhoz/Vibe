import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { ExportModal } from './ExportModal';

describe('ExportModal', () => {
  it('exports the selected format before closing', () => {
    const onClose = vi.fn();
    const onExport = vi.fn();

    render(
      <LanguageProvider>
        <ExportModal
          isOpen
          onClose={onClose}
          onExport={onExport}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'DOCX .docx' }));
    fireEvent.click(screen.getByRole('button', { name: /save file/i }));

    expect(onExport).toHaveBeenCalledWith('docx');
    expect(onClose).toHaveBeenCalled();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PasteModal } from './PasteModal';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: {
      paste: {
        title: 'Paste lyrics',
        cancel: 'Cancel paste',
        description: 'Paste your lyrics here.',
        placeholder: 'Paste text here',
        analyzing: 'Analyzing paste',
        analyze: 'Analyze pasted lyrics',
      },
      tooltips: {
        analysisCancel: 'Cancel the paste import',
        analysisImport: 'Analyze the pasted lyrics',
      },
    },
  }),
}));

vi.mock('lucide-react', () => ({
  X: () => null,
  ClipboardPaste: () => null,
  Sparkles: () => null,
  Loader2: () => null,
}));

describe('PasteModal', () => {
  const createProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    pastedText: 'First line',
    setPastedText: vi.fn(),
    isAnalyzing: false,
    onAnalyze: vi.fn(),
  });

  it('renders nothing when the modal is closed', () => {
    render(<PasteModal {...createProps()} isOpen={false} />);

    expect(screen.queryByRole('dialog', { name: 'Paste lyrics' })).toBeNull();
  });

  it('renders the dialog and closes from the close action when it is open', () => {
    const props = createProps();

    render(<PasteModal {...props} />);

    expect(screen.getByRole('dialog', { name: 'Paste lyrics' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel paste' })[0]!);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('updates the pasted text and runs analysis when content is available', () => {
    const props = createProps();

    render(<PasteModal {...props} />);

    fireEvent.change(screen.getByPlaceholderText('Paste text here'), { target: { value: 'Updated text' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze the pasted lyrics' }));

    expect(props.setPastedText).toHaveBeenCalledWith('Updated text');
    expect(props.onAnalyze).toHaveBeenCalledTimes(1);
  });

  it('disables analysis and shows the analyzing label for conditional states', () => {
    const props = createProps();
    const { rerender } = render(<PasteModal {...props} pastedText="   " />);

    expect(screen.getByRole('button', { name: 'Analyze the pasted lyrics' }).hasAttribute('disabled')).toBe(true);

    rerender(<PasteModal {...props} isAnalyzing pastedText="Ready" />);

    expect(screen.getByRole('button', { name: 'Analyze the pasted lyrics' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Analyzing paste')).toBeTruthy();
  });
});

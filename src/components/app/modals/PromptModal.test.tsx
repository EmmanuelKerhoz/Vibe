import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PromptModal } from './PromptModal';

vi.mock('lucide-react', () => ({
  AlertTriangle: () => null,
}));

describe('PromptModal', () => {
  const createProps = () => ({
    isOpen: true,
    title: 'Save version',
    message: 'Enter a version name',
    placeholder: 'Version name',
    defaultValue: 'Draft 1',
    confirmLabel: 'Save',
    cancelLabel: 'Cancel',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  });

  it('renders nothing when the modal is closed', () => {
    render(<PromptModal {...createProps()} isOpen={false} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the dialog and restores the default value when reopened', () => {
    const props = createProps();
    const { rerender } = render(<PromptModal {...props} />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Enter a version name'), { target: { value: 'Changed name' } });

    rerender(<PromptModal {...props} isOpen={false} />);
    rerender(<PromptModal {...props} isOpen defaultValue="Fresh start" />);

    expect((screen.getByLabelText('Enter a version name') as HTMLInputElement).value).toBe('Fresh start');
  });

  it('confirms with a trimmed value and cancels from keyboard interaction', () => {
    const props = createProps();

    render(<PromptModal {...props} defaultValue="  New draft  " />);

    fireEvent.keyDown(screen.getByLabelText('Enter a version name'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByLabelText('Enter a version name'), { key: 'Escape' });

    expect(props.onConfirm).toHaveBeenCalledWith('New draft');
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables confirmation for empty values', () => {
    render(<PromptModal {...createProps()} defaultValue="   " />);

    expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled')).toBe(true);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResetModal } from './ResetModal';

vi.mock('lucide-react', () => ({
  Trash2: () => null,
  X: () => null,
}));

describe('ResetModal', () => {
  const createProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  });

  it('renders nothing when the modal is closed', () => {
    render(<ResetModal {...createProps()} isOpen={false} />);

    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('renders the reset alert dialog when it is open', () => {
    render(<ResetModal {...createProps()} />);

    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('Reset Song')).toBeTruthy();
  });

  it('calls the close and confirm callbacks from the main actions', () => {
    const props = createProps();

    render(<ResetModal {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear Everything' }));

    expect(props.onClose).toHaveBeenCalledTimes(2);
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });
});

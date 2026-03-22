import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';

vi.mock('../../ui/icons', () => ({
  AlertTriangle: () => null,
}));

describe('ConfirmModal', () => {
  const createProps = () => ({
    isOpen: true,
    title: 'Delete song',
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Keep',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  });

  it('renders nothing when the modal is closed', () => {
    render(<ConfirmModal {...createProps()} isOpen={false} />);

    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('renders the confirmation alert dialog when it is open', () => {
    render(<ConfirmModal {...createProps()} />);

    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('Delete song')).toBeTruthy();
  });

  it('calls the business callbacks from the cancel and confirm actions', () => {
    const props = createProps();
    const { container } = render(<ConfirmModal {...props} />);

    fireEvent.click(container.querySelector('.absolute.inset-0') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));

    expect(props.onCancel).toHaveBeenCalledTimes(2);
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });
});

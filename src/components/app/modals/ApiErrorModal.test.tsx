import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiErrorModal } from './ApiErrorModal';

vi.mock('lucide-react', () => ({
  AlertTriangle: () => null,
  X: () => null,
}));

describe('ApiErrorModal', () => {
  it('renders nothing when the modal is closed', () => {
    render(<ApiErrorModal isOpen={false} onClose={() => {}} message="Request failed" />);

    expect(screen.queryByRole('dialog', { name: 'API Error' })).toBeNull();
  });

  it('renders the dialog and shows the API error message when it is open', () => {
    render(<ApiErrorModal isOpen onClose={() => {}} message="Request failed" />);

    expect(screen.getByRole('dialog', { name: 'API Error' })).toBeTruthy();
    expect(screen.getByText('Request failed')).toBeTruthy();
  });

  it('closes from the close actions and keyboard backdrop interaction', () => {
    const onClose = vi.fn();
    const { container } = render(<ApiErrorModal isOpen onClose={onClose} message="Request failed" />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]!);
    fireEvent.keyDown(container.querySelector('[role="button"]') as HTMLElement, { key: 'Enter' });

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

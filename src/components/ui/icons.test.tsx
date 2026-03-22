import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkles } from './icons';

describe('ui icon proxies', () => {
  it('renders Fluent icons with lucide-like props', () => {
    render(<Sparkles data-testid="icon" size={24} color="rgb(255, 0, 0)" className="test-icon" />);

    const icon = screen.getByTestId('icon');
    expect(icon).not.toBeNull();
    expect(icon.classList.contains('test-icon')).toBe(true);
    expect(icon.getAttribute('style')).toContain('color: rgb(255, 0, 0)');
    expect(icon.getAttribute('style')).toContain('font-size: 24px');
    expect(icon.getAttribute('style')).toContain('width: 24px');
    expect(icon.getAttribute('style')).toContain('height: 24px');
  });
});

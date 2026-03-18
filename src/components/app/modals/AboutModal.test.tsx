import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { AboutModal } from './AboutModal';

describe('AboutModal', () => {
  it('shows the donation sponsor link and preserves all social links in the about dialog', () => {
    render(
      <LanguageProvider>
        <AboutModal isOpen onClose={() => {}} />
      </LanguageProvider>,
    );

    const donationLink = screen.getByText('Donation (Github Sponsor)').closest('a');

    expect(donationLink?.getAttribute('href')).toBe('https://github.com/sponsors/EmmanuelKerhoz');
    expect(screen.getAllByRole('link')).toHaveLength(7);
  });
});

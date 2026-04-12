import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { AboutModal } from './AboutModal';
import { APP_VERSION_LABEL } from '../../../version';

describe('AboutModal', () => {
  it('shows the donation sponsor link and preserves all social links in the about dialog', () => {
    const { container } = render(
      <LanguageProvider>
        <AboutModal isOpen onClose={() => {}} />
      </LanguageProvider>,
    );

    const donationLink = screen.getByText('Donation (Github Sponsor)').closest('a');

    expect(donationLink?.getAttribute('href')).toBe('https://github.com/sponsors/EmmanuelKerhoz');
    expect(screen.getAllByRole('link')).toHaveLength(8);
    expect(container.querySelector('.lcars-gradient-outline')).toBeTruthy();
  });

  it('shows the beta-prefixed app version in the dialog header', () => {
    render(
      <LanguageProvider>
        <AboutModal isOpen onClose={() => {}} />
      </LanguageProvider>,
    );

    expect(screen.getByText(APP_VERSION_LABEL, { exact: false })).toBeTruthy();
  });
});

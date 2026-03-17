import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { AboutModal } from './AboutModal';

describe('AboutModal', () => {
  it('includes a GitHub Sponsors link in the about dialog', () => {
    render(
      <LanguageProvider>
        <AboutModal isOpen onClose={() => {}} />
      </LanguageProvider>,
    );

    expect(
      screen.getByRole('link', { name: 'Visit GitHub Sponsors page' }).getAttribute('href'),
    ).toBe('https://github.com/sponsors/EmmanuelKerhoz');
  });
});

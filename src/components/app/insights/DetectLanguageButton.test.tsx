import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider, SUPPORTED_ADAPTATION_LANGUAGES } from '../../../i18n';
import { DetectLanguageButton } from './DetectLanguageButton';

vi.mock('../../ui/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactElement }) => children,
}));

const baseProps = {
  detectedDisplays: [],
  hasLyrics: false,
  isDetectingLanguage: false,
  hasApiKey: true,
  onDetect: vi.fn(),
};

function renderButton(overrides?: Partial<React.ComponentProps<typeof DetectLanguageButton>>) {
  return render(
    <LanguageProvider>
      <DetectLanguageButton {...baseProps} {...overrides} />
    </LanguageProvider>,
  );
}

describe('DetectLanguageButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('keeps the picker open after the trigger click', async () => {
    const user = userEvent.setup();

    renderButton({ onSetDefaultLanguage: vi.fn() });

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('listbox', { name: 'Default language' })).toBeInTheDocument();
  });

  it('logs rejected onDetect errors without crashing', async () => {
    const user = userEvent.setup();
    const error = new Error('detect failed');
    const onDetect = vi.fn().mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderButton({ hasLyrics: true, onDetect });

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('[DetectLanguageButton] onDetect failed:', error);
    });
    expect(screen.getByRole('button')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('supports ArrowDown, End, and Enter keyboard navigation', async () => {
    const user = userEvent.setup();
    const onSetDefaultLanguage = vi.fn();

    renderButton({ onSetDefaultLanguage });

    await user.click(screen.getByRole('button'));
    const options = await screen.findAllByRole('option');

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(options[1]).toHaveAttribute('tabindex', '0');
    });

    await user.keyboard('{End}');
    const lastOption = options.at(-1)!;
    await waitFor(() => {
      expect(lastOption).toHaveAttribute('tabindex', '0');
    });

    await user.keyboard('{Enter}');

    expect(onSetDefaultLanguage).toHaveBeenCalledWith(
      SUPPORTED_ADAPTATION_LANGUAGES.at(-1)!.code.toLowerCase(),
    );
    await waitFor(() => {
      expect(screen.queryByRole('listbox', { name: 'Default language' })).not.toBeInTheDocument();
    });
  });

  it('moves focus into the listbox when it opens', async () => {
    const user = userEvent.setup();

    renderButton({ onSetDefaultLanguage: vi.fn() });

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('role', 'option');
    });
  });

  it('renders with no detected displays', () => {
    expect(() => {
      renderButton({ hasLyrics: true, detectedDisplays: [] });
    }).not.toThrow();

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

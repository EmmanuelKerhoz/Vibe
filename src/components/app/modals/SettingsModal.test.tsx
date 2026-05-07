import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { SettingsModal } from './SettingsModal';
import { APP_VERSION_LABEL } from '../../../version';

const createProps = () => ({
  isOpen: true,
  onClose: vi.fn(),
  theme: 'dark' as const,
  setTheme: vi.fn(),
  audioFeedback: true,
  setAudioFeedback: vi.fn(),
  uiScale: 'large' as const,
  setUiScale: vi.fn(),
  defaultEditMode: 'section' as const,
  setDefaultEditMode: vi.fn(),
  showTranslationFeatures: true,
  setShowTranslationFeatures: vi.fn(),
});

describe('SettingsModal', () => {
  afterEach(() => {
    document.documentElement.style.fontSize = '';
    localStorage.clear();
  });

  it('previews UI scale changes and reverts them when the dialog closes without saving', () => {
    const props = createProps();

    render(
      <LanguageProvider>
        <SettingsModal {...props} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /small/i }));
    expect(document.documentElement.style.fontSize).toBe('12px');

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    expect(closeButtons).toHaveLength(2);

    fireEvent.click(closeButtons[1]!);

    expect(document.documentElement.style.fontSize).toBe('16px');
    expect(props.setUiScale).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the selected UI scale when the dialog is saved', () => {
    const props = createProps();

    render(
      <LanguageProvider>
        <SettingsModal {...props} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /medium/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(document.documentElement.style.fontSize).toBe('14px');
    expect(props.setUiScale).toHaveBeenCalledWith('medium');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the beta-prefixed app version in the settings surface', () => {
    const props = createProps();

    render(
      <LanguageProvider>
        <SettingsModal {...props} />
      </LanguageProvider>,
    );

    expect(screen.getAllByText(APP_VERSION_LABEL).length).toBeGreaterThan(0);
  });

  it('renders UI language options with flag icons and keeps the canonical locale selected', () => {
    localStorage.setItem('lyricist_language', 'ui:fr');
    const props = createProps();

    render(
      <LanguageProvider>
        <SettingsModal {...props} />
      </LanguageProvider>,
    );

    const frenchButton = screen.getByRole('button', { name: 'Français' });
    const englishButton = screen.getByRole('button', { name: 'English' });

    expect(frenchButton.className).toContain('bg-[var(--accent-color)]/10');
    expect(englishButton.className).not.toContain('bg-[var(--accent-color)]/10');
    expect(frenchButton.querySelector('img[alt="🇫🇷"]')).not.toBeNull();
  });
});

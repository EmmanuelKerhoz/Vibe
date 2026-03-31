import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { TopRibbon } from './TopRibbon';

const mockNavigation = vi.hoisted(() => ({
  activeTab: 'lyrics' as 'lyrics' | 'musical',
  setActiveTab: vi.fn(),
  isLeftPanelOpen: false,
  setIsLeftPanelOpen: vi.fn(),
  isStructureOpen: false,
  setIsStructureOpen: vi.fn(),
}));

const mockComposer = vi.hoisted(() => ({
  isGenerating: false,
  clearSelection: vi.fn(),
}));

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => ({
    song: [],
    past: [],
    future: [],
    undo: vi.fn(),
    redo: vi.fn(),
  }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => mockComposer,
}));

vi.mock('../../contexts/AppStateContext', () => ({
  useAppNavigationContext: () => mockNavigation,
}));

describe('TopRibbon burger menu', () => {
  beforeEach(() => {
    mockNavigation.activeTab = 'lyrics';
    mockNavigation.isLeftPanelOpen = false;
    mockNavigation.isStructureOpen = false;
    mockNavigation.setActiveTab.mockClear();
    mockNavigation.setIsLeftPanelOpen.mockClear();
    mockNavigation.setIsStructureOpen.mockClear();
    mockComposer.clearSelection.mockClear();
  });

  it('exposes the redesigned primary navigation actions', () => {
    const onOpenNewGeneration = vi.fn();
    const onOpenNewEmpty = vi.fn();
    const onImportClick = vi.fn();
    const onOpenLibraryClick = vi.fn();
    const onOpenSettingsClick = vi.fn();
    const onOpenAboutClick = vi.fn();
    const onOpenKeyboardShortcutsClick = vi.fn();

    render(
      <LanguageProvider>
        <TopRibbon
          setIsVersionsModalOpen={() => {}}
          setIsResetModalOpen={() => {}}
          hasApiKey
          handleApiKeyHelp={() => {}}
          onOpenNewGeneration={onOpenNewGeneration}
          onOpenNewEmpty={onOpenNewEmpty}
          canPasteLyrics={true}
          onPasteLyrics={onOpenNewEmpty}
          onImportClick={onImportClick}
          onExportClick={() => {}}
          onOpenLibraryClick={onOpenLibraryClick}
          onOpenSettingsClick={onOpenSettingsClick}
          onOpenAboutClick={onOpenAboutClick}
          onOpenKeyboardShortcutsClick={onOpenKeyboardShortcutsClick}
          isAnalyzing={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    expect(screen.getByRole('button', { name: 'Load/Import' }).className).not.toContain('lcars-holo');
    expect(screen.getByRole('button', { name: 'Settings' }).className).not.toContain('lcars-holo');
    const menu = screen.getByText('Create').parentElement as HTMLDivElement;
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.left).toBe('12px');
    expect(menu.style.top).toBe('6px');
    expect(menu.style.maxHeight).toContain('100dvh');
    fireEvent.click(screen.getByRole('button', { name: 'New Lyrics Generation' }));
    expect(onOpenNewGeneration).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'New Song' }));
    expect(onOpenNewEmpty).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load/Import' }));
    expect(onImportClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(onOpenLibraryClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'MUSICAL' }));
    expect(mockNavigation.setActiveTab).toHaveBeenCalledWith('musical');

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenSettingsClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(onOpenAboutClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Show keyboard shortcuts' }));
    expect(onOpenKeyboardShortcutsClick).toHaveBeenCalledTimes(1);
  });

  it('toggles the left generation panel from the ribbon', () => {
    mockNavigation.activeTab = 'musical';
    mockNavigation.isStructureOpen = true;

    render(
      <LanguageProvider>
        <TopRibbon
          setIsVersionsModalOpen={() => {}}
          setIsResetModalOpen={() => {}}
          hasApiKey
          handleApiKeyHelp={() => {}}
          onOpenNewGeneration={() => {}}
          onOpenNewEmpty={() => {}}
          canPasteLyrics={true}
          onPasteLyrics={() => {}}
          onImportClick={() => {}}
          onExportClick={() => {}}
          onOpenLibraryClick={() => {}}
          onOpenSettingsClick={() => {}}
          onOpenAboutClick={() => {}}
          onOpenKeyboardShortcutsClick={() => {}}
          isAnalyzing={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open lyrics generation panel' }));

    expect(mockNavigation.setActiveTab).toHaveBeenCalledWith('lyrics');
    expect(mockNavigation.setIsStructureOpen).toHaveBeenCalledWith(false);
    expect(mockNavigation.setIsLeftPanelOpen).toHaveBeenCalledWith(true);
  });

  it('disables the menu paste action when there is no text available to paste', () => {
    render(
      <LanguageProvider>
        <TopRibbon
          setIsVersionsModalOpen={() => {}}
          setIsResetModalOpen={() => {}}
          hasApiKey
          handleApiKeyHelp={() => {}}
          onOpenNewGeneration={() => {}}
          onOpenNewEmpty={() => {}}
          canPasteLyrics={false}
          onPasteLyrics={() => {}}
          onImportClick={() => {}}
          onExportClick={() => {}}
          onOpenLibraryClick={() => {}}
          onOpenSettingsClick={() => {}}
          onOpenAboutClick={() => {}}
          onOpenKeyboardShortcutsClick={() => {}}
          isAnalyzing={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));

    expect(screen.getByRole('button', { name: /paste/i })).toBeDisabled();
  });

  it('clears selection before opening the structure panel', () => {
    render(
      <LanguageProvider>
        <TopRibbon
          setIsVersionsModalOpen={() => {}}
          setIsResetModalOpen={() => {}}
          hasApiKey
          handleApiKeyHelp={() => {}}
          onOpenNewGeneration={() => {}}
          onOpenNewEmpty={() => {}}
          canPasteLyrics={true}
          onPasteLyrics={() => {}}
          onImportClick={() => {}}
          onExportClick={() => {}}
          onOpenLibraryClick={() => {}}
          onOpenSettingsClick={() => {}}
          onOpenAboutClick={() => {}}
          onOpenKeyboardShortcutsClick={() => {}}
          isAnalyzing={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Sidebar' }));

    expect(mockComposer.clearSelection).toHaveBeenCalledTimes(1);
    expect(mockNavigation.setIsStructureOpen).toHaveBeenCalledWith(true);
  });
});
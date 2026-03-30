import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { TopRibbon } from './TopRibbon';

const navigationState = {
  activeTab: 'lyrics' as 'lyrics' | 'musical',
  setActiveTab: vi.fn(),
  isLeftPanelOpen: false,
  setIsLeftPanelOpen: vi.fn(),
  isStructureOpen: false,
  setIsStructureOpen: vi.fn(),
};

vi.mock('../../contexts/AppStateContext', () => ({
  useAppNavigationContext: () => navigationState,
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
  useComposerContext: () => ({
    isGenerating: false,
    clearSelection: vi.fn(),
  }),
}));

describe('TopRibbon burger menu', () => {
  it('exposes the redesigned primary navigation actions', () => {
    navigationState.activeTab = 'lyrics';
    navigationState.setActiveTab = vi.fn();
    navigationState.isLeftPanelOpen = false;
    navigationState.setIsLeftPanelOpen = vi.fn();
    navigationState.isStructureOpen = false;
    navigationState.setIsStructureOpen = vi.fn();
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
          onOpenSearchClick={() => {}}
          isAnalyzing={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('button', { name: 'Load/Import' }).className).not.toContain('lcars-holo');
    expect(screen.getByRole('button', { name: 'Settings' }).className).not.toContain('lcars-holo');
    const menu = screen.getByText('Create').parentElement as HTMLDivElement;
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.left).toBe('12px');
    expect(menu.style.top).toBe('6px');
    expect(menu.style.maxHeight).toContain('100dvh');
    fireEvent.click(screen.getByRole('button', { name: 'New generation' }));
    expect(onOpenNewGeneration).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'New empty' }));
    expect(onOpenNewEmpty).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
          fireEvent.click(screen.getByRole('button', { name: 'Load/Import' }));
    expect(onImportClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(onOpenLibraryClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'MUSICAL' }));
    expect(navigationState.setActiveTab).toHaveBeenCalledWith('musical');

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenSettingsClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(onOpenAboutClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Show keyboard shortcuts' }));
    expect(onOpenKeyboardShortcutsClick).toHaveBeenCalledTimes(1);
  });

  it('toggles the left generation panel from the ribbon', () => {
    navigationState.activeTab = 'musical';
    navigationState.setActiveTab = vi.fn();
    navigationState.isLeftPanelOpen = false;
    navigationState.setIsLeftPanelOpen = vi.fn();
    navigationState.isStructureOpen = true;
    navigationState.setIsStructureOpen = vi.fn();

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
          onOpenSearchClick={() => {}}
          isAnalyzing={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open lyrics generation panel' }));

    expect(navigationState.setActiveTab).toHaveBeenCalledWith('lyrics');
    expect(navigationState.setIsStructureOpen).toHaveBeenCalledWith(false);
    expect(navigationState.setIsLeftPanelOpen).toHaveBeenCalledWith(true);
  });

  it('disables the menu paste action when there is no text available to paste', () => {
    navigationState.activeTab = 'lyrics';
    navigationState.setActiveTab = vi.fn();
    navigationState.isLeftPanelOpen = false;
    navigationState.setIsLeftPanelOpen = vi.fn();
    navigationState.isStructureOpen = false;
    navigationState.setIsStructureOpen = vi.fn();

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
          onOpenSearchClick={() => {}}
          isAnalyzing={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect((screen.getByRole('button', { name: 'Paste Lyrics' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

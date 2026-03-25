import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { TopRibbon } from './TopRibbon';

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
  }),
}));

describe('TopRibbon burger menu', () => {
  it('exposes the redesigned primary navigation actions', () => {
    const setActiveTab = vi.fn();
    const setIsLeftPanelOpen = vi.fn();
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
          activeTab="lyrics"
          setActiveTab={setActiveTab}
          setIsVersionsModalOpen={() => {}}
          setIsResetModalOpen={() => {}}
          isLeftPanelOpen={false}
          setIsLeftPanelOpen={setIsLeftPanelOpen}
          isStructureOpen={false}
          setIsStructureOpen={() => {}}
          hasApiKey
          handleApiKeyHelp={() => {}}
          onOpenNewGeneration={onOpenNewGeneration}
          onOpenNewEmpty={onOpenNewEmpty}
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

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
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
    expect(setActiveTab).toHaveBeenCalledWith('musical');

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
    const setActiveTab = vi.fn();
    const setIsLeftPanelOpen = vi.fn();
    const setIsStructureOpen = vi.fn();

    render(
      <LanguageProvider>
        <TopRibbon
          activeTab="musical"
          setActiveTab={setActiveTab}
          setIsVersionsModalOpen={() => {}}
          setIsResetModalOpen={() => {}}
          isLeftPanelOpen={false}
          setIsLeftPanelOpen={setIsLeftPanelOpen}
          isStructureOpen={true}
          setIsStructureOpen={setIsStructureOpen}
          hasApiKey
          handleApiKeyHelp={() => {}}
          onOpenNewGeneration={() => {}}
          onOpenNewEmpty={() => {}}
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

    expect(setActiveTab).toHaveBeenCalledWith('lyrics');
    expect(setIsStructureOpen).toHaveBeenCalledWith(false);
    expect(setIsLeftPanelOpen).toHaveBeenCalledWith(true);
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { TopRibbon } from './TopRibbon';

describe('TopRibbon burger menu', () => {
  it('exposes the redesigned primary navigation actions', () => {
    const setActiveTab = vi.fn();
    const onOpenNewGeneration = vi.fn();
    const onOpenNewEmpty = vi.fn();
    const onImportClick = vi.fn();
    const onOpenLibraryClick = vi.fn();
    const onOpenSettingsClick = vi.fn();
    const onOpenAboutClick = vi.fn();

    render(
      <LanguageProvider>
        <TopRibbon
          activeTab="lyrics"
          setActiveTab={setActiveTab}
          song={[]}
          past={[]}
          future={[]}
          undo={() => {}}
          redo={() => {}}
          setIsVersionsModalOpen={() => {}}
          setIsResetModalOpen={() => {}}
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
          isGenerating={false}
          isAnalyzing={false}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'New generation' }));
    expect(onOpenNewGeneration).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'New empty' }));
    expect(onOpenNewEmpty).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
          fireEvent.click(screen.getByRole('button', { name: 'Load/Import' }));
    expect(onImportClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(onOpenLibraryClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'MUSICAL' }));
    expect(setActiveTab).toHaveBeenCalledWith('musical');

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenSettingsClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(onOpenAboutClick).toHaveBeenCalledTimes(1);
  });
});

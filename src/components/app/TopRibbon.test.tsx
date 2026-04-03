import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { TopRibbon } from './TopRibbon';

// ─── Context mocks ────────────────────────────────────────────────────────────

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

const mockRibbonActions = vi.hoisted(() => ({
  openVersionsModal: vi.fn(),
  openResetModal: vi.fn(),
  openImport: vi.fn(),
  openExport: vi.fn(),
  openLibrary: vi.fn(),
  openSettings: vi.fn(),
  openAbout: vi.fn(),
  openKeyboardShortcuts: vi.fn(),
  openPasteModal: vi.fn(),
  canPasteLyrics: true,
  isAnalyzing: false,
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

vi.mock('../../hooks/useTopRibbonActions', () => ({
  useTopRibbonActions: () => mockRibbonActions,
}));

// ─── Default props (the 4 remaining props) ────────────────────────────────────

const defaultProps = {
  hasApiKey: true,
  handleApiKeyHelp: vi.fn(),
  onOpenNewGeneration: vi.fn(),
  onOpenNewEmpty: vi.fn(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TopRibbon burger menu', () => {
  beforeEach(() => {
    mockNavigation.activeTab = 'lyrics';
    mockNavigation.isLeftPanelOpen = false;
    mockNavigation.isStructureOpen = false;
    mockNavigation.setActiveTab.mockClear();
    mockNavigation.setIsLeftPanelOpen.mockClear();
    mockNavigation.setIsStructureOpen.mockClear();
    mockComposer.clearSelection.mockClear();
    mockRibbonActions.openVersionsModal.mockClear();
    mockRibbonActions.openResetModal.mockClear();
    mockRibbonActions.openImport.mockClear();
    mockRibbonActions.openExport.mockClear();
    mockRibbonActions.openLibrary.mockClear();
    mockRibbonActions.openSettings.mockClear();
    mockRibbonActions.openAbout.mockClear();
    mockRibbonActions.openKeyboardShortcuts.mockClear();
    mockRibbonActions.openPasteModal.mockClear();
    mockRibbonActions.canPasteLyrics = true;
    mockRibbonActions.isAnalyzing = false;
    defaultProps.onOpenNewGeneration.mockClear();
    defaultProps.onOpenNewEmpty.mockClear();
  });

  it('exposes the redesigned primary navigation actions', () => {
    render(
      <LanguageProvider>
        <TopRibbon {...defaultProps} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    expect(screen.getByRole('button', { name: 'Import lyrics from a file' }).className).not.toContain('lcars-holo');
    expect(screen.getByRole('button', { name: 'Open application settings' }).className).not.toContain('lcars-holo');
    const menu = screen.getByText('Create').parentElement as HTMLDivElement;
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.left).toBe('12px');
    expect(menu.style.top).toBe('6px');
    expect(menu.style.maxHeight).toContain('100dvh');

    fireEvent.click(screen.getByRole('button', { name: 'Generate new lyrics using AI' }));
    expect(defaultProps.onOpenNewGeneration).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create a new empty song' }));
    expect(defaultProps.onOpenNewEmpty).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Import lyrics from a file' }));
    expect(mockRibbonActions.openImport).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save or browse your song library' }));
    expect(mockRibbonActions.openLibrary).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Switch to the musical tab' }));
    expect(mockNavigation.setActiveTab).toHaveBeenCalledWith('musical');

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open application settings' }));
    expect(mockRibbonActions.openSettings).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'About this application' }));
    expect(mockRibbonActions.openAbout).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /keyboard shortcuts/i }));
    expect(mockRibbonActions.openKeyboardShortcuts).toHaveBeenCalledTimes(1);
  });

  it('toggles the left generation panel from the ribbon', () => {
    mockNavigation.activeTab = 'musical';
    mockNavigation.isStructureOpen = true;

    render(
      <LanguageProvider>
        <TopRibbon {...defaultProps} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open lyrics generation panel' }));

    expect(mockNavigation.setActiveTab).toHaveBeenCalledWith('lyrics');
    expect(mockNavigation.setIsStructureOpen).toHaveBeenCalledWith(false);
    expect(mockNavigation.setIsLeftPanelOpen).toHaveBeenCalledWith(true);
  });

  it('disables the menu paste action when there is no text available to paste', () => {
    mockRibbonActions.canPasteLyrics = false;

    render(
      <LanguageProvider>
        <TopRibbon {...defaultProps} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));

    expect((screen.getByRole('button', { name: /paste/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('clears selection before opening the structure panel', () => {
    render(
      <LanguageProvider>
        <TopRibbon {...defaultProps} />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show Sidebar' }));

    expect(mockComposer.clearSelection).toHaveBeenCalledTimes(1);
    expect(mockNavigation.setIsStructureOpen).toHaveBeenCalledWith(true);
  });
});

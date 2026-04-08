import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopRibbon } from './TopRibbon';

// ── Context mocks ────────────────────────────────────────────────────────────
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockClearSelection = vi.fn();
const mockSetActiveTab = vi.fn();
const mockSetIsLeftPanelOpen = vi.fn();
const mockSetIsStructureOpen = vi.fn();
const mockOpenKeyboardShortcuts = vi.fn();

vi.mock('../../contexts/SongContext', () => ({
  useSongHistoryContext: () => ({
    past: [],
    future: [],
    undo: mockUndo,
    redo: mockRedo,
  }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => ({
    isGenerating: false,
    clearSelection: mockClearSelection,
  }),
}));

const navState = {
  activeTab: 'lyrics' as const,
  setActiveTab: mockSetActiveTab,
  isLeftPanelOpen: false,
  setIsLeftPanelOpen: mockSetIsLeftPanelOpen,
  isStructureOpen: false,
  setIsStructureOpen: mockSetIsStructureOpen,
};

vi.mock('../../contexts/AppStateContext', () => ({
  useAppNavigationContext: () => navState,
}));

vi.mock('../../hooks/useTopRibbonActions', () => ({
  useTopRibbonActions: () => ({
    openKeyboardShortcuts: mockOpenKeyboardShortcuts,
    isAnalyzing: false,
  }),
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: {
      tooltips: {
        undo: 'Undo',
        redo: 'Redo',
        processing: 'Processing…',
        aiUnavailableHelp: 'Configure API key',
        keyboardShortcuts: 'Keyboard shortcuts',
        closeLeftPanel: 'Close panel',
        openLeftPanel: 'Open panel',
        collapseRight: 'Collapse',
        showSidebar: 'Show sidebar',
      },
      ribbon: { aiUnavailable: 'AI unavailable' },
    },
  }),
}));

// Stub heavy sub-components so tests stay unit-scoped
vi.mock('./RibbonMenuPanel', () => ({
  RibbonMenuPanel: () => <div data-testid="ribbon-menu-panel" />,
}));
vi.mock('./RibbonTabs', () => ({
  RibbonTabs: () => <div data-testid="ribbon-tabs" />,
}));

// ── Default props ────────────────────────────────────────────────────────────
const defaultProps = {
  hasApiKey: true,
  handleApiKeyHelp: vi.fn(),
  onOpenNewGeneration: vi.fn(),
  onOpenNewEmpty: vi.fn(),
};

function renderRibbon(props = {}) {
  return render(<TopRibbon {...defaultProps} {...props} />);
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('TopRibbon', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    renderRibbon();
    expect(screen.getByRole('button', { name: 'Open main menu' })).toBeDefined();
  });

  it('undo button is disabled when no past', () => {
    renderRibbon();
    const undoBtn = screen.getByRole('button', { name: 'Undo' });
    expect(undoBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('redo button is disabled when no future', () => {
    renderRibbon();
    const redoBtn = screen.getByRole('button', { name: 'Redo' });
    expect(redoBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('undo / redo fire their callbacks when enabled', () => {
    vi.mocked(await import('../../contexts/SongContext')).useSongHistoryContext
      // @ts-expect-error — vi.mock override
      .mockReturnValueOnce({ past: [{}], future: [{}], undo: mockUndo, redo: mockRedo });
    renderRibbon();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(mockUndo).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(mockRedo).toHaveBeenCalledOnce();
  });

  it('shows AI-unavailable badge when hasApiKey=false', () => {
    renderRibbon({ hasApiKey: false });
    expect(screen.getByText('AI unavailable')).toBeDefined();
  });

  it('hides AI-unavailable badge when hasApiKey=true', () => {
    renderRibbon({ hasApiKey: true });
    expect(screen.queryByText('AI unavailable')).toBeNull();
  });

  it('calls handleApiKeyHelp when AI badge is clicked', () => {
    const handleApiKeyHelp = vi.fn();
    renderRibbon({ hasApiKey: false, handleApiKeyHelp });
    fireEvent.click(screen.getByText('AI unavailable'));
    expect(handleApiKeyHelp).toHaveBeenCalledOnce();
  });

  it('opens menu panel on burger click', () => {
    renderRibbon();
    expect(screen.queryByTestId('ribbon-menu-panel')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));
    expect(screen.getByTestId('ribbon-menu-panel')).toBeDefined();
  });

  it('closes menu panel on second burger click', () => {
    renderRibbon();
    const burger = screen.getByRole('button', { name: 'Open main menu' });
    fireEvent.click(burger);
    fireEvent.click(burger);
    expect(screen.queryByTestId('ribbon-menu-panel')).toBeNull();
  });

  it('calls openKeyboardShortcuts on keyboard button click', () => {
    renderRibbon();
    fireEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));
    expect(mockOpenKeyboardShortcuts).toHaveBeenCalledOnce();
  });

  it('toggles left panel open', () => {
    renderRibbon();
    fireEvent.click(screen.getByRole('button', { name: 'Open panel' }));
    expect(mockSetIsLeftPanelOpen).toHaveBeenCalledWith(true);
  });

  it('toggles structure panel and clears selection', () => {
    renderRibbon();
    fireEvent.click(screen.getByRole('button', { name: 'Show sidebar' }));
    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockSetIsStructureOpen).toHaveBeenCalledWith(true);
  });

  it('shows processing indicator when isGenerating=true', () => {
    vi.mocked(await import('../../contexts/ComposerContext')).useComposerContext
      // @ts-expect-error — vi.mock override
      .mockReturnValueOnce({ isGenerating: true, clearSelection: mockClearSelection });
    renderRibbon();
    expect(screen.getByLabelText('Processing')).toBeDefined();
  });
});

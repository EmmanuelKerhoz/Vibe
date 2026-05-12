import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TopRibbon } from './TopRibbon';

// ── Mutable state refs — mutated per-test, read by the mock factory ──────────
let mockPast: unknown[] = [];
let mockFuture: unknown[] = [];
let mockIsGenerating = false;
let mockIsAnalyzing = false;
let mockIsLeftPanelOpen = false;
let mockIsStructureOpen = false;
let mockMusicalPrompt = '';

const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockClearSelection = vi.fn();
const mockSetActiveTab = vi.fn();
const mockSetIsLeftPanelOpen = vi.fn();
const mockSetIsStructureOpen = vi.fn();
const mockOpenKeyboardShortcuts = vi.fn();

vi.mock('../../contexts/SongContext', () => ({
  useSongHistoryContext: () => ({
    past: mockPast,
    future: mockFuture,
    undo: mockUndo,
    redo: mockRedo,
  }),
  useSongContext: () => ({
    musicalPrompt: mockMusicalPrompt,
  }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => ({
    isGenerating: mockIsGenerating,
    clearSelection: mockClearSelection,
  }),
}));

vi.mock('../../contexts/AppStateContext', () => ({
  useAppNavigationContext: () => ({
    activeTab: 'lyrics' as const,
    setActiveTab: mockSetActiveTab,
    isLeftPanelOpen: mockIsLeftPanelOpen,
    setIsLeftPanelOpen: mockSetIsLeftPanelOpen,
    isStructureOpen: mockIsStructureOpen,
    setIsStructureOpen: mockSetIsStructureOpen,
  }),
}));

vi.mock('../../hooks/useTopRibbonActions', () => ({
  useTopRibbonActions: () => ({
    openKeyboardShortcuts: mockOpenKeyboardShortcuts,
    isAnalyzing: mockIsAnalyzing,
  }),
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: {
      tooltips: {
        undo: 'Undo',
        redo: 'Redo',
        processing: 'Processing\u2026',
        aiUnavailableHelp: 'Configure API key',
        keyboardShortcuts: 'Keyboard shortcuts',
        closeLeftPanel: 'Close panel',
        openLeftPanel: 'Open panel',
        collapseRight: 'Collapse',
        showSidebar: 'Show sidebar',
        sendToSuno: 'Open SUNO with your musical prompt',
        sendToSunoConfirm: 'Opening SUNO…',
        quantizeLineDone: 'Line quantized',
      },
      ribbon: {
        aiUnavailable: 'AI unavailable',
        send_to_suno: 'Send to SUNO',
        menu: 'Menu',
        menuAria: 'Open main menu',
      },
    },
  }),
}));

// Tooltip: transparent wrapper so aria-label on inner buttons is reachable
vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ children, title }: { children: React.ReactNode; title: string }) => <span title={title}>{children}</span>,
}));

vi.mock('./RibbonMenuPanel', () => ({
  RibbonMenuPanel: () => <div data-testid="ribbon-menu-panel" />,
}));
vi.mock('./RibbonTabs', () => ({
  RibbonTabs: () => <div data-testid="ribbon-tabs" />,
}));
vi.mock('../../constants/externalUrls', () => ({
  SUNO_CREATE_URL: 'https://suno.com/create',
}));

// ── Default props ────────────────────────────────────────────────────────────
const defaultProps = {
  hasApiKey: true,
  handleApiKeyHelp: vi.fn(),
  onOpenNewGeneration: vi.fn(),
  onOpenNewEmpty: vi.fn(),
};

function renderRibbon(props: Partial<typeof defaultProps> = {}) {
  return render(<TopRibbon {...defaultProps} {...props} />);
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('TopRibbon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPast = [];
    mockFuture = [];
    mockIsGenerating = false;
    mockIsAnalyzing = false;
    mockMusicalPrompt = '';
    mockIsLeftPanelOpen = false;
    mockIsStructureOpen = false;
  });

  it('renders without crashing', () => {
    renderRibbon();
    expect(screen.getByRole('button', { name: 'Open main menu' })).toBeDefined();
  });

  it('undo button is disabled when no past', () => {
    renderRibbon();
    expect(screen.getByRole('button', { name: 'Undo' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('redo button is disabled when no future', () => {
    renderRibbon();
    expect(screen.getByRole('button', { name: 'Redo' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('undo fires callback when past is non-empty', () => {
    mockPast = [{}];
    renderRibbon();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(mockUndo).toHaveBeenCalledOnce();
  });

  it('redo fires callback when future is non-empty', () => {
    mockFuture = [{}];
    renderRibbon();
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
    mockIsGenerating = true;
    renderRibbon();
    expect(screen.getByLabelText('Processing')).toBeDefined();
  });

  it('shows processing indicator when isAnalyzing=true', () => {
    mockIsAnalyzing = true;
    renderRibbon();
    expect(screen.getByLabelText('Processing')).toBeDefined();
  });

  it('truncates long SUNO prompts before encoding them into the URL', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    mockMusicalPrompt = 'a'.repeat(2000);
    renderRibbon();

    fireEvent.click(screen.getByRole('button', { name: 'Send to SUNO' }));

    expect(openSpy).toHaveBeenCalledWith(
      `https://suno.com/create?prompt=${'a'.repeat(1800)}`,
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('uses a distinct confirmation tooltip after sending to SUNO', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderRibbon();

    fireEvent.click(screen.getByRole('button', { name: 'Send to SUNO' }));

    expect(screen.getByTitle('Opening SUNO…')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send to SUNO' })).toBeDisabled();
    openSpy.mockRestore();
  });
});

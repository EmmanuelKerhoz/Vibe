import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { SuggestionsPanel } from './SuggestionsPanel';

function renderSuggestionsPanel() {
  const setSelectedLineId = vi.fn();

  const view = render(
    <LanguageProvider>
      <SuggestionsPanel
        selectedLineId="line-1"
        setSelectedLineId={setSelectedLineId}
        suggestions={['A brighter line']}
        isSuggesting={false}
        hasApiKey
        applySuggestion={vi.fn()}
        generateSuggestions={vi.fn()}
      />
    </LanguageProvider>,
  );

  return { ...view, setSelectedLineId };
}

describe('SuggestionsPanel', () => {
  it('uses the shared panel shell without an extra left separator rail', () => {
    const { container } = renderSuggestionsPanel();

    const panel = container.querySelector('[data-suggestions-panel]');
    expect(panel).not.toBeNull();
    // The absolute-positioned LCARS rail must have been removed
    const absoluteRail = panel?.querySelector('div[style*="position: absolute"][style*="width: 2px"]');
    expect(absoluteRail).toBeNull();
  });

  it('clears the selected line when closing the panel', () => {
    const { setSelectedLineId } = renderSuggestionsPanel();

    // isMobileOverlay defaults to false → aria-label is 'Clear line suggestions'
    fireEvent.click(screen.getByRole('button', { name: 'Clear line suggestions' }));

    expect(setSelectedLineId).toHaveBeenCalledWith(null);
  });
});

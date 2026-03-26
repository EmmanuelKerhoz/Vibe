import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { DragProvider } from '../../contexts/DragContext';
import { StructureSidebar } from './StructureSidebar';

vi.mock('../../contexts/SongHistoryContext', () => ({
  useSongHistoryContext: () => ({
    song: [
      { id: 's1', name: 'Intro', lines: [] },
      { id: 's2', name: 'Turnaround', lines: [] },
    ],
    structure: ['Intro', 'Turnaround'],
  }),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposerContext: () => ({
    isGenerating: false,
  }),
}));

function renderStructureSidebar({
  addStructureItem = vi.fn(),
  initialDropdownOpen = false,
}: {
  addStructureItem?: ReturnType<typeof vi.fn>;
  initialDropdownOpen?: boolean;
} = {}) {
  function Wrapper() {
    const [isSectionDropdownOpen, setIsSectionDropdownOpen] = React.useState(initialDropdownOpen);

    return (
      <DragProvider>
        <LanguageProvider>
          <StructureSidebar
            isStructureOpen
            setIsStructureOpen={() => {}}
            isSectionDropdownOpen={isSectionDropdownOpen}
            setIsSectionDropdownOpen={setIsSectionDropdownOpen}
            addStructureItem={addStructureItem}
            removeStructureItem={vi.fn()}
            normalizeStructure={vi.fn()}
            handleDrop={vi.fn()}
            onScrollToSection={vi.fn()}
          />
        </LanguageProvider>
      </DragProvider>
    );
  }

  return render(<Wrapper />);
}

describe('StructureSidebar section tooltips', () => {
  it('shows explanations for supported section buttons in the right panel', () => {
    renderStructureSidebar({ initialDropdownOpen: true });

    const turnaroundButton = screen.getByRole('button', { name: /Courte transition/ });
    expect(turnaroundButton.textContent).toContain('Turnaround');

    const interludeOption = screen.getByRole('option', { name: 'Interlude' });
    expect(interludeOption.getAttribute('title')).toMatch(/souvent instrumental/);
  });

  it('uses the updated right-panel controls and removes the extra generate button', () => {
    const addStructureItem = vi.fn();

    renderStructureSidebar({ addStructureItem });

    expect(screen.queryByRole('button', { name: 'Generate Lyrics' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add section' }));
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Verse' }));

    expect(screen.queryAllByRole('button', { name: /^Add section$/ })).toHaveLength(1);
    expect(screen.queryByRole('option', { name: 'Verse' })).toBeNull();
    expect(addStructureItem).toHaveBeenCalledTimes(1);
    expect(addStructureItem).toHaveBeenCalledWith('Verse');

    const turnaroundButton = screen.getAllByRole('button', { name: /Courte transition/ })[0]!;
    expect(turnaroundButton.closest('div.group')?.className).toContain('rounded-[12px_4px_12px_4px]');
  });
});

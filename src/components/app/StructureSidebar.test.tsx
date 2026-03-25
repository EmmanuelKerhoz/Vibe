import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { DragProvider } from '../../contexts/DragContext';
import { StructureSidebar } from './StructureSidebar';

vi.mock('../../contexts/SongContext', () => ({
  useSongContext: () => ({
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

describe('StructureSidebar section tooltips', () => {
  it('shows explanations for supported section buttons in the right panel', () => {
    render(
      <DragProvider>
        <LanguageProvider>
          <StructureSidebar
            isStructureOpen
            setIsStructureOpen={() => {}}
            newSectionName=""
            setNewSectionName={() => {}}
            isSectionDropdownOpen
            setIsSectionDropdownOpen={() => {}}
            addStructureItem={vi.fn()}
            removeStructureItem={vi.fn()}
            normalizeStructure={vi.fn()}
            handleDrop={vi.fn()}
            onScrollToSection={vi.fn()}
          />
        </LanguageProvider>
      </DragProvider>,
    );

    // Check that the section buttons have tooltip content as their accessible label
    const turnaroundButtons = screen.getAllByRole('button', { name: /Courte transition/ });
    expect(turnaroundButtons.length).toBeGreaterThan(0);
    expect(turnaroundButtons.some(button => button.textContent === 'Turnaround')).toBe(true);

    const interludeButtons = screen.getAllByRole('button', { name: /souvent instrumental/ });
    expect(interludeButtons.length).toBeGreaterThan(0);
  });

  it('uses the updated right-panel controls and removes the extra generate button', () => {
    const addStructureItem = vi.fn();

    render(
      <DragProvider>
        <LanguageProvider>
          <StructureSidebar
            isStructureOpen
            setIsStructureOpen={() => {}}
            newSectionName=""
            setNewSectionName={() => {}}
            isSectionDropdownOpen={false}
            setIsSectionDropdownOpen={() => {}}
            addStructureItem={addStructureItem}
            removeStructureItem={vi.fn()}
            normalizeStructure={vi.fn()}
            handleDrop={vi.fn()}
            onScrollToSection={vi.fn()}
          />
        </LanguageProvider>
      </DragProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Generate Lyrics' })).toBeNull();

    const addSectionButton = screen.getByRole('button', { name: 'Add section' });
    fireEvent.click(addSectionButton);
    expect(addStructureItem).toHaveBeenCalledTimes(1);

    const turnaroundButton = screen.getAllByRole('button', { name: /Courte transition/ })[0]!;
    expect(turnaroundButton.closest('div.group')?.className).toContain('rounded-[12px_4px_12px_4px]');
  });
});

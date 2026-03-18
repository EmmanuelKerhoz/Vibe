import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../i18n';
import { StructureSidebar } from './StructureSidebar';

describe('StructureSidebar section tooltips', () => {
  it('shows explanations for supported section buttons in the right panel', () => {
    render(
      <LanguageProvider>
        <StructureSidebar
          isStructureOpen
          setIsStructureOpen={() => {}}
          structure={['Intro', 'Turnaround']}
          song={[
            { id: 's1', name: 'Intro', lines: [] },
            { id: 's2', name: 'Turnaround', lines: [] },
          ]}
          newSectionName=""
          setNewSectionName={() => {}}
          isSectionDropdownOpen
          setIsSectionDropdownOpen={() => {}}
          draggedItemIndex={null}
          setDraggedItemIndex={() => {}}
          dragOverIndex={null}
          setDragOverIndex={() => {}}
          isGenerating={false}
          addStructureItem={vi.fn()}
          removeStructureItem={vi.fn()}
          normalizeStructure={vi.fn()}
          handleDrop={vi.fn()}
          onScrollToSection={vi.fn()}
        />
      </LanguageProvider>,
    );

    const turnaroundButtons = screen.getAllByRole('button', { name: 'Turnaround' });
    expect(turnaroundButtons.some(button =>
      button.getAttribute('title')?.includes('Courte transition'),
    )).toBe(true);

    const interludeButtons = screen.getAllByRole('button', { name: 'Interlude' });
    expect(interludeButtons.some(button =>
      button.getAttribute('title')?.includes('souvent instrumental'),
    )).toBe(true);
  });
});

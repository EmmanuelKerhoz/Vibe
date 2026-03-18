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

    // Check that the section buttons have tooltip content as their accessible label
    const turnaroundButtons = screen.getAllByRole('button', { name: /Courte transition/ });
    expect(turnaroundButtons.length).toBeGreaterThan(0);
    expect(turnaroundButtons.some(button => button.textContent === 'Turnaround')).toBe(true);

    const interludeButtons = screen.getAllByRole('button', { name: /souvent instrumental/ });
    expect(interludeButtons.length).toBeGreaterThan(0);
  });
});

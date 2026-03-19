import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../i18n';
import { MusicalPromptBuilder } from './MusicalPromptBuilder';

describe('MusicalPromptBuilder', () => {
  it('shows prompt usage against the 1000 character limit and enforces the limit on the textarea', () => {
    render(
      <LanguageProvider>
        <MusicalPromptBuilder
          musicalPrompt="Warm pads, syncopated drums"
          setMusicalPrompt={vi.fn()}
          isGeneratingMusicalPrompt={false}
          isAnalyzingLyrics={false}
          canGenerate
          generateMusicalPrompt={vi.fn()}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText('27 / 1000')).toBeTruthy();
    expect(screen.getByRole('textbox').getAttribute('maxlength')).toBe('1000');
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import {
  CHECKER_DISCLAIMER,
  CopyrightCheckerPanel,
} from '../components/CopyrightCheckerPanel';
import { SourceType } from '../domain/enums';
import { buildNormalizedDocumentFields } from '../utils/normalizeLyrics';
import { InMemoryReferenceRepository } from '../services/repository/ReferenceCorpusRepository';
import type { ReferenceLyricDocument } from '../domain/types';

const buildReference = (
  id: string,
  title: string,
  text: string,
): ReferenceLyricDocument => ({
  id,
  sourceType: SourceType.LICENSED_REFERENCE,
  title,
  language: 'en',
  ...buildNormalizedDocumentFields(text, { language: 'en' }),
});

const HOOK_TEXT =
  'neon ghosts dance under tangerine skies\nverse one here\nneon ghosts dance under tangerine skies';

const renderPanel = (
  props: Partial<React.ComponentProps<typeof CopyrightCheckerPanel>> = {},
) => {
  const repo =
    props.repository ??
    new InMemoryReferenceRepository([
      buildReference('r1', 'Hook Ref', `${HOOK_TEXT}\nfiller line one\n${HOOK_TEXT}`),
    ]);
  return render(
    <FluentProvider theme={webLightTheme}>
      <CopyrightCheckerPanel repository={repo} {...props} />
    </FluentProvider>,
  );
};

describe('CopyrightCheckerPanel', () => {
  it('renders the idle empty state with the mandatory disclaimer', () => {
    renderPanel();
    expect(screen.getByLabelText('Lyrics similarity risk checker')).toBeTruthy();
    expect(
      screen.getByText('Enter lyrics and run a check to see results.'),
    ).toBeTruthy();
    expect(screen.getByText(CHECKER_DISCLAIMER)).toBeTruthy();
  });

  it('disables "Run similarity check" while the textarea is empty', () => {
    renderPanel();
    const runButton = screen.getByRole('button', {
      name: /Run similarity check/i,
    });
    expect((runButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('surfaces validation errors for invalid language codes via role="alert"', async () => {
    const user = userEvent.setup();
    renderPanel({ initialText: HOOK_TEXT });

    const language = screen.getByRole('textbox', { name: /Language/i });
    await user.clear(language);
    await user.type(language, 'xx-yyy'); // capped at 5 chars by maxLength
    // Bring in an invalid code with spaces guaranteed to fail validation.
    await user.clear(language);
    await user.type(language, 'zz_z');

    const runButton = screen.getByRole('button', {
      name: /Run similarity check/i,
    });
    await user.click(runButton);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent ?? '').toMatch(/Invalid language code/);
  });

  it('runs an end-to-end check and renders the results region with the table caption', async () => {
    const user = userEvent.setup();
    renderPanel({ initialText: HOOK_TEXT, initialLanguage: 'en' });

    await user.click(
      screen.getByRole('button', { name: /Run similarity check/i }),
    );

    const region = await screen.findByRole(
      'region',
      { name: /Similarity check results/i },
      { timeout: 4_000 },
    );
    expect(region).toBeTruthy();

    // Fluent UI v9 Table renders a real <table> element (implicit role
    // "table"); we wired its accessible name through aria-labelledby
    // pointing at a visually-hidden caption.
    const table = await within(region).findByRole('table', {
      name: /Flagged overlaps between the submitted lyrics and reference documents/i,
    });
    expect(table).toBeTruthy();
  });
});

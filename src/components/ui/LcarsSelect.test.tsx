import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LcarsSelect } from './LcarsSelect';

describe('LcarsSelect', () => {
  it('renders the dropdown in a portal and closes on outside click', () => {
    const { container } = render(
      <LcarsSelect
        value="verse"
        onChange={() => {}}
        options={[
          { value: 'verse', label: 'VERSE' },
          { value: 'chorus', label: 'CHORUS' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(document.body.querySelector('[role="listbox"]')).not.toBeNull();
    expect(screen.getByRole('option', { name: 'CHORUS' })).not.toBeNull();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

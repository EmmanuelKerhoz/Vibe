import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LcarsSelect } from './LcarsSelect';

describe('LcarsSelect', () => {
  it('removes the hover halo while preserving accent border feedback', () => {
    render(
      <LcarsSelect
        value="verse"
        onChange={() => {}}
        options={[
          { value: 'verse', label: 'VERSE' },
          { value: 'chorus', label: 'CHORUS' },
        ]}
      />,
    );

    const button = screen.getByRole('button');

    fireEvent.mouseEnter(button);
    expect(button.style.boxShadow).toBe('');
    expect(button.style.borderColor).toBe('var(--accent-color)');

    fireEvent.mouseLeave(button);
    expect(button.style.boxShadow).toBe('');
    expect(button.style.borderColor).toBe('var(--border-color)');

    fireEvent.focus(button);
    expect(button.style.boxShadow).toBe('');
    expect(button.style.borderColor).toBe('var(--accent-color)');
  });

  it('renders the dropdown in a portal and closes on outside click', () => {
    const { container } = render(
      <LcarsSelect
        value="verse"
        onChange={() => {}}
        options={[
          { value: 'verse', label: 'VERSE', title: 'Tell the story' },
          { value: 'chorus', label: 'CHORUS', title: 'Main hook' },
        ]}
        buttonTitle="Tell the story"
      />,
    );

    expect(screen.getByRole('button').getAttribute('title')).toBe('Tell the story');

    fireEvent.click(screen.getByRole('button'));

    expect(container.querySelector('[role="listbox"]')).toBeNull();
    const listbox = document.body.querySelector('[role="listbox"]');

    expect(listbox).not.toBeNull();
    expect((listbox as HTMLElement).parentElement?.style.width).toBe('320px');
    expect(screen.getByRole('option', { name: 'CHORUS' }).getAttribute('title')).toBe('Main hook');

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

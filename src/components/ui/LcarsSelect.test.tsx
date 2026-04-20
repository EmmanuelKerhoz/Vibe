import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

    // buttonTitle is rendered via a Tooltip component (positioned above) instead of a native title attribute
    expect(screen.getByText('Tell the story')).toBeTruthy();

    fireEvent.click(screen.getByRole('button'));

    expect(container.querySelector('[role="listbox"]')).toBeNull();
    const listbox = document.body.querySelector('[role="listbox"]');

    expect(listbox).not.toBeNull();
    expect((listbox as HTMLElement).parentElement?.style.width).toBe('320px');
    expect(screen.getByRole('option', { name: 'CHORUS' }).getAttribute('title')).toBe('Main hook');

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('filters options live by case-insensitive startsWith on label text when searchable', () => {
    render(
      <LcarsSelect
        value=""
        onChange={() => {}}
        searchable
        options={[
          { value: 'french', label: 'French' },
          { value: 'frisian', label: 'Frisian' },
          { value: 'german', label: 'German' },
          { value: 'spanish', label: 'Spanish' },
          { value: '__custom__', label: 'Other language…', alwaysShow: true, searchText: 'Other language' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    const search = screen.getByRole('textbox');
    fireEvent.change(search, { target: { value: 'fr' } });

    expect(screen.queryByRole('option', { name: 'French' })).not.toBeNull();
    expect(screen.queryByRole('option', { name: 'Frisian' })).not.toBeNull();
    expect(screen.queryByRole('option', { name: 'German' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'Spanish' })).toBeNull();
    // alwaysShow keeps the custom entry visible even when it doesn't match the filter
    expect(screen.queryByRole('option', { name: 'Other language…' })).not.toBeNull();
  });

  it('forwards search input changes to onSearchChange', () => {
    const changes: string[] = [];
    render(
      <LcarsSelect
        value=""
        onChange={() => {}}
        searchable
        searchValue=""
        onSearchChange={(v) => changes.push(v)}
        options={[{ value: 'french', label: 'French' }]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'fr' } });

    expect(changes).toEqual(['fr']);
  });

  it('selects the first enabled visible option when Enter is pressed in the search input with no focus', () => {
    const onChange = vi.fn();
    render(
      <LcarsSelect
        value=""
        onChange={onChange}
        searchable
        options={[
          { value: '__hdr__', label: 'Romance', disabled: true },
          { value: 'french', label: 'French' },
          { value: 'frisian', label: 'Frisian' },
          { value: 'german', label: 'German' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    const search = screen.getByRole('textbox');
    fireEvent.change(search, { target: { value: 'fr' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('french');
  });
});

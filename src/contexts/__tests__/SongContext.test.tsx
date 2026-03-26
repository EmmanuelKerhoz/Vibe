import React, { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SongProvider } from '../SongContext';
import { useSongHistoryContext } from '../SongHistoryContext';
import { useSongMetaContext } from '../SongMetaContext';

const makeSection = (id: string, name: string) => ({
  id,
  name,
  lines: [],
});

const readProbe = (testId: string) => JSON.parse(screen.getByTestId(testId).textContent ?? '{}') as {
  renders: number;
  title?: string;
  songLength?: number;
  canUndo?: boolean;
};

function HistoryProbe() {
  const renders = useRef(0);
  renders.current += 1;
  const { song, canUndo } = useSongHistoryContext();

  return (
    <div data-testid="history-probe">
      {JSON.stringify({ renders: renders.current, songLength: song.length, canUndo })}
    </div>
  );
}

function MetaProbe() {
  const renders = useRef(0);
  renders.current += 1;
  const { title } = useSongMetaContext();

  return (
    <div data-testid="meta-probe">
      {JSON.stringify({ renders: renders.current, title })}
    </div>
  );
}

function HistoryUpdater() {
  const { updateSongWithHistory } = useSongHistoryContext();

  return (
    <button
      type="button"
      onClick={() => updateSongWithHistory([makeSection('s1', 'Verse 1'), makeSection('s2', 'Chorus')])}
    >
      Update history
    </button>
  );
}

function MetaUpdater() {
  const { setTitle } = useSongMetaContext();

  return (
    <button type="button" onClick={() => setTitle('Updated title')}>
      Update meta
    </button>
  );
}

describe('SongProvider context split', () => {
  it('does not re-render history consumers when only song meta changes', () => {
    render(
      <SongProvider>
        <HistoryProbe />
        <MetaProbe />
        <MetaUpdater />
      </SongProvider>,
    );

    expect(readProbe('history-probe').renders).toBe(1);
    expect(readProbe('meta-probe').renders).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Update meta' }));

    expect(readProbe('history-probe').renders).toBe(1);
    expect(readProbe('meta-probe').renders).toBe(2);
    expect(readProbe('meta-probe').title).toBe('Updated title');
  });

  it('does not re-render meta consumers when only history changes', () => {
    render(
      <SongProvider>
        <HistoryProbe />
        <MetaProbe />
        <HistoryUpdater />
      </SongProvider>,
    );

    expect(readProbe('history-probe').renders).toBe(1);
    expect(readProbe('meta-probe').renders).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Update history' }));

    expect(readProbe('history-probe').renders).toBe(2);
    expect(readProbe('history-probe').songLength).toBe(2);
    expect(readProbe('history-probe').canUndo).toBe(true);
    expect(readProbe('meta-probe').renders).toBe(1);
  });
});

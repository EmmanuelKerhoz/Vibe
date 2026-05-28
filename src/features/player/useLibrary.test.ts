import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLibrary } from './useLibrary';

describe('useLibrary blob URL lifecycle', () => {
  const originalRevoke = URL.revokeObjectURL;

  afterEach(() => {
    URL.revokeObjectURL = originalRevoke;
    vi.restoreAllMocks();
  });

  it('revokes previous blob URL when updating a track URL', () => {
    const revokeObjectURL = vi.fn();
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL;
    const { result } = renderHook(() => useLibrary());

    act(() => {
      result.current.addTracks([{ title: 'Track', source: 'cloud', url: 'blob:old' }]);
    });
    const trackId = result.current.tracks[0]?.id;
    expect(trackId).toBeDefined();

    act(() => {
      result.current.updateUrl(trackId!, 'blob:new');
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:old');
  });

  it('revokes blob URL when removing a track', () => {
    const revokeObjectURL = vi.fn();
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL;
    const { result } = renderHook(() => useLibrary());

    act(() => {
      result.current.addTracks([{ title: 'Track', source: 'cloud', url: 'blob:remove' }]);
    });
    const trackId = result.current.tracks[0]?.id;

    act(() => {
      result.current.removeTrack(trackId!);
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:remove');
  });
});

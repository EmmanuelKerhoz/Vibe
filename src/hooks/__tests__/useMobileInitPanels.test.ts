import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMobileInitPanels } from '../useMobileInitPanels';

describe('useMobileInitPanels', () => {
  it('closes both panels on initial mount when already on mobile or tablet', () => {
    const setIsLeftPanelOpen = vi.fn();
    const setIsStructureOpen = vi.fn();

    renderHook(() => useMobileInitPanels({
      isMobileOrTablet: true,
      setIsLeftPanelOpen,
      setIsStructureOpen,
    }));

    expect(setIsLeftPanelOpen).toHaveBeenCalledWith(false);
    expect(setIsStructureOpen).toHaveBeenCalledWith(false);
  });

  it('does not close panels on initial mount when starting on desktop', () => {
    const setIsLeftPanelOpen = vi.fn();
    const setIsStructureOpen = vi.fn();

    renderHook(() => useMobileInitPanels({
      isMobileOrTablet: false,
      setIsLeftPanelOpen,
      setIsStructureOpen,
    }));

    expect(setIsLeftPanelOpen).not.toHaveBeenCalled();
    expect(setIsStructureOpen).not.toHaveBeenCalled();
  });

  it('closes both panels when transitioning from desktop to mobile or tablet', () => {
    const setIsLeftPanelOpen = vi.fn();
    const setIsStructureOpen = vi.fn();

    const { rerender } = renderHook(
      ({ isMobileOrTablet }) => useMobileInitPanels({
        isMobileOrTablet,
        setIsLeftPanelOpen,
        setIsStructureOpen,
      }),
      { initialProps: { isMobileOrTablet: false } },
    );

    rerender({ isMobileOrTablet: true });

    expect(setIsLeftPanelOpen).toHaveBeenCalledTimes(1);
    expect(setIsLeftPanelOpen).toHaveBeenCalledWith(false);
    expect(setIsStructureOpen).toHaveBeenCalledTimes(1);
    expect(setIsStructureOpen).toHaveBeenCalledWith(false);
  });

  it('does not close panels again when remaining on mobile or tablet', () => {
    const setIsLeftPanelOpen = vi.fn();
    const setIsStructureOpen = vi.fn();

    const { rerender } = renderHook(
      ({ isMobileOrTablet }) => useMobileInitPanels({
        isMobileOrTablet,
        setIsLeftPanelOpen,
        setIsStructureOpen,
      }),
      { initialProps: { isMobileOrTablet: true } },
    );

    rerender({ isMobileOrTablet: true });

    expect(setIsLeftPanelOpen).toHaveBeenCalledTimes(1);
    expect(setIsStructureOpen).toHaveBeenCalledTimes(1);
  });
});

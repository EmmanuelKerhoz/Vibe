import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Section } from '../../types';
import { resolveLineHeightPx, useScrollToSection } from '../useScrollToSection';

const section: Section = {
  id: 'verse-1',
  name: 'Verse',
  lines: [],
};

describe('resolveLineHeightPx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses computed line-height when it is numeric', () => {
    const element = document.createElement('textarea');
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '24px',
      fontSize: '18px',
    } as CSSStyleDeclaration);

    expect(resolveLineHeightPx(element)).toBe(24);
  });

  it('falls back to font-size ratio before the fixed fallback', () => {
    const element = document.createElement('textarea');
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: 'normal',
      fontSize: '18px',
    } as CSSStyleDeclaration);

    expect(resolveLineHeightPx(element)).toBeCloseTo(21.6);
  });
});

describe('useScrollToSection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('selects the section header and scrolls text mode using the resolved line height', () => {
    const textarea = document.createElement('textarea');
    const focus = vi.spyOn(textarea, 'focus').mockImplementation(() => undefined);
    const setSelectionRange = vi.spyOn(textarea, 'setSelectionRange').mockImplementation(() => undefined);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: 'normal',
      fontSize: '10px',
    } as CSSStyleDeclaration);

    const { result } = renderHook(() => useScrollToSection({
      editMode: 'markdown',
      markupText: '[Intro]\nOne\n[Verse]\nTwo',
      markupTextareaRef: { current: textarea },
    }));

    act(() => {
      result.current.scrollToSection(section);
    });

    expect(focus).toHaveBeenCalledOnce();
    expect(setSelectionRange).toHaveBeenCalledWith(12, 19);
    expect(textarea.scrollTop).toBe(12);
  });

  it('scrolls the section element inside its scroll container in section mode', () => {
    const container = document.createElement('div');
    container.className = 'overflow-y-auto';
    const element = document.createElement('div');
    element.id = 'section-verse-1';
    container.appendChild(element);
    document.body.appendChild(container);

    Object.defineProperty(container, 'scrollTop', { value: 5, writable: true });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 10 } as DOMRect);
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ top: 70 } as DOMRect);
    Object.defineProperty(container, 'scrollTo', {
      value: vi.fn(),
      configurable: true,
    });
    const scrollTo = vi.spyOn(container, 'scrollTo').mockImplementation(() => undefined);

    const { result } = renderHook(() => useScrollToSection({
      editMode: 'section',
      markupText: '',
      markupTextareaRef: { current: null },
    }));

    act(() => {
      result.current.scrollToSection(section);
    });

    expect(scrollTo).toHaveBeenCalledWith({
      top: 45,
      behavior: 'smooth',
    });
  });
});

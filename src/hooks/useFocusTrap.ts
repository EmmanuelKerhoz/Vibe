import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ');

/**
 * Focus trap for modal-like overlays.
 *
 * When `active` is true:
 *  - Tab / Shift+Tab cycle within `containerRef`.
 *  - Escape calls `onClose`.
 *  - Focus moves to first focusable element on mount.
 *  - Focus returns to the element that was focused before mount on unmount.
 *
 * When `active` is false the hook is a complete no-op (desktop panels).
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  onClose: () => void,
): void {
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    previousFocusRef.current = document.activeElement;

    const el = containerRef.current;
    if (!el) return;

    const getFocusable = (): HTMLElement[] =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
        node => !node.closest('[aria-hidden="true"]'),
      );

    // Set initial focus.
    const nodes = getFocusable();
    if (nodes.length > 0) nodes[0]!.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const prev = previousFocusRef.current;
      if (prev && 'focus' in prev) (prev as HTMLElement).focus();
    };
  }, [active, containerRef, onClose]);
}

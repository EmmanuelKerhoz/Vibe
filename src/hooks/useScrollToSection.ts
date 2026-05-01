/**
 * useScrollToSection
 * Atomic hook — scroll only, no song→markup sync effect.
 * Use this when you need scrollToSection without the full useMarkupEditor overhead.
 */
import { useCallback } from 'react';
import type { EditMode, Section } from '../types';

interface UseScrollToSectionParams {
  editMode: EditMode;
  markupText: string;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const resolveLineHeightPx = (element: HTMLElement): number => {
  const computedStyle = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) return lineHeight;

  const fontSize = Number.parseFloat(computedStyle.fontSize);
  if (Number.isFinite(fontSize) && fontSize > 0) return fontSize * 1.2;

  return 20;
};

export function useScrollToSection({
  editMode,
  markupText,
  markupTextareaRef,
}: UseScrollToSectionParams) {
  const scrollToSection = useCallback(
    (section: Section) => {
      if (editMode !== 'section') {
        if (!markupTextareaRef.current) return;
        let searchStr = `**[${section.name}]**`;
        let index = markupText.indexOf(searchStr);
        if (index === -1) {
          searchStr = `[${section.name}]`;
          index = markupText.indexOf(searchStr);
        }
        if (index !== -1) {
          const ta = markupTextareaRef.current;
          ta.focus();
          ta.setSelectionRange(index, index + searchStr.length);
          ta.scrollTop =
            (markupText.substring(0, index).split('\n').length - 2) *
            resolveLineHeightPx(ta);
        }
      } else {
        const el = document.getElementById(`section-${section.id}`);
        if (el) {
          const container = el.closest('.overflow-y-auto');
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            container.scrollTo({
              top: container.scrollTop + elRect.top - containerRect.top - 20,
              behavior: 'smooth',
            });
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    },
    [editMode, markupText, markupTextareaRef],
  );

  return { scrollToSection };
}

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
          const rawLineHeight = window.getComputedStyle(ta).lineHeight;
          const lineHeight = parseFloat(rawLineHeight);
          const resolvedLineHeight = isFinite(lineHeight) ? lineHeight : 20;
          ta.scrollTop =
            (markupText.substring(0, index).split('\n').length - 2) *
            resolvedLineHeight;
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

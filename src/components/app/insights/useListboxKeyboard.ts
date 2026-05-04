import { useCallback } from 'react';
import { SUPPORTED_ADAPTATION_LANGUAGES } from '../../../i18n';

interface UseListboxKeyboardOptions {
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  closePicker: () => void;
  onSetDefaultLanguage?: (langCode: string) => void;
}

export function useListboxKeyboard({
  activeIndex,
  setActiveIndex,
  closePicker,
  onSetDefaultLanguage,
}: UseListboxKeyboardOptions) {
  const count = SUPPORTED_ADAPTATION_LANGUAGES.length;

  const handleListboxKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % count);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + count) % count);
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(count - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (activeIndex >= 0 && onSetDefaultLanguage) {
            const selected = SUPPORTED_ADAPTATION_LANGUAGES[activeIndex];
            if (!selected) return;
            onSetDefaultLanguage(selected.code.toLowerCase());
            closePicker();
          }
          break;
        case 'Escape':
          e.preventDefault();
          closePicker();
          break;
        default:
          break;
      }
    },
    [activeIndex, closePicker, count, onSetDefaultLanguage, setActiveIndex],
  );

  return { handleListboxKeyDown };
}

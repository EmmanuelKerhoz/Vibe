import { useCallback, useState } from 'react';
import { SUPPORTED_ADAPTATION_LANGUAGES } from '../../../i18n';

const POPOVER_WIDTH = 240;
const POPOVER_GAP = 6;
const POPOVER_MAX_H = 260;

export interface PickerCoords {
  top?: number;
  bottom?: number;
  left: number;
}

interface UsePickerCoordsOptions {
  defaultLanguage?: string | undefined;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export interface UsePickerCoordsReturn {
  coords: PickerCoords | null;
  popoverWidth: number;
  openPicker: (e: React.MouseEvent) => void;
  closePicker: () => void;
  pickerOpen: boolean;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function usePickerCoords({
  defaultLanguage,
  triggerRef,
}: UsePickerCoordsOptions): UsePickerCoordsReturn {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [coords, setCoords] = useState<PickerCoords | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, [triggerRef]);

  const openPicker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom - POPOVER_GAP;
      if (spaceBelow >= POPOVER_MAX_H) {
        setCoords({ top: r.bottom + POPOVER_GAP, left: r.left });
      } else {
        setCoords({ bottom: window.innerHeight - r.top + POPOVER_GAP, left: r.left });
      }
      const preselect = defaultLanguage
        ? SUPPORTED_ADAPTATION_LANGUAGES.findIndex(
            (l) => l.code.toLowerCase() === defaultLanguage.toLowerCase(),
          )
        : 0;
      setActiveIndex(preselect >= 0 ? preselect : 0);
      setPickerOpen(true);
    },
    [defaultLanguage, triggerRef],
  );

  return { coords, popoverWidth: POPOVER_WIDTH, openPicker, closePicker, pickerOpen, activeIndex, setActiveIndex };
}

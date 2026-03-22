import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type UseMobileInitPanelsParams = {
  isMobileOrTablet: boolean;
  setIsLeftPanelOpen: Dispatch<SetStateAction<boolean>>;
  setIsStructureOpen: Dispatch<SetStateAction<boolean>>;
};

export const useMobileInitPanels = ({
  isMobileOrTablet,
  setIsLeftPanelOpen,
  setIsStructureOpen,
}: UseMobileInitPanelsParams) => {
  const mobileInitDoneRef = useRef(false);
  const prevIsMobileOrTabletRef = useRef(isMobileOrTablet);

  useEffect(() => {
    const wasMobileOrTablet = prevIsMobileOrTabletRef.current;
    prevIsMobileOrTabletRef.current = isMobileOrTablet;

    if (!mobileInitDoneRef.current) {
      mobileInitDoneRef.current = true;
      if (isMobileOrTablet) {
        setIsLeftPanelOpen(false);
        setIsStructureOpen(false);
      }
      return;
    }

    if (isMobileOrTablet && !wasMobileOrTablet) {
      setIsLeftPanelOpen(false);
      setIsStructureOpen(false);
    }
  }, [isMobileOrTablet, setIsLeftPanelOpen, setIsStructureOpen]);
};

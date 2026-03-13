import { useState, useEffect } from 'react';

export interface MobileLayoutState {
  isMobile: boolean;       // < 768px
  isTablet: boolean;       // 768px–1023px
  isDesktop: boolean;      // >= 1024px
  isLandscape: boolean;
  safeAreaBottom: number;  // iOS home indicator height (px)
}

const getState = (): MobileLayoutState => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;
  const isDesktop = w >= 1024;
  const isLandscape = w > h;
  // Approximate safe area bottom via CSS env — fallback 0
  const safeAreaBottom = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--sab') || '0',
    10
  );
  return { isMobile, isTablet, isDesktop, isLandscape, safeAreaBottom };
};

export function useMobileLayout(): MobileLayoutState {
  const [state, setState] = useState<MobileLayoutState>(getState);

  useEffect(() => {
    const update = () => setState(getState());
    const mq = window.matchMedia('(max-width: 767px)');
    mq.addEventListener('change', update);
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update);
    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return state;
}

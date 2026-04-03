/**
 * useThemeState
 *
 * Owns: theme toggle + applies `dark` class to <html>.
 * Extracted from useSessionState (Phase-2 domain-hook split).
 */
import { useState, useEffect } from 'react';

export function useThemeState() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return { theme, setTheme };
}

import React, { createContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import type { Translations } from './locales/types';
import en from './locales/en';
import fr from './locales/fr';
import es from './locales/es';
import de from './locales/de';
import pt from './locales/pt';
import ar from './locales/ar';
import zh from './locales/zh';

const locales: Record<string, Translations> = { en, fr, es, de, pt, ar, zh };

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' as const },
  { code: 'fr', label: 'Français', dir: 'ltr' as const },
  { code: 'es', label: 'Español', dir: 'ltr' as const },
  { code: 'de', label: 'Deutsch', dir: 'ltr' as const },
  { code: 'pt', label: 'Português', dir: 'ltr' as const },
  { code: 'ar', label: 'العربية', dir: 'rtl' as const },
  { code: 'zh', label: '中文', dir: 'ltr' as const },
];

export interface LanguageContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: Translations;
  dir: 'ltr' | 'rtl';
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      return localStorage.getItem('lyricist_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('lyricist_language', lang);
    } catch {
      // ignore storage errors
    }
  }, []);

  const t = useMemo(() => locales[language] ?? locales.en, [language]);

  const dir = useMemo(
    () => SUPPORTED_LANGUAGES.find(l => l.code === language)?.dir ?? 'ltr',
    [language],
  );

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', dir);
  }, [language, dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, dir }),
    [language, setLanguage, t, dir],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

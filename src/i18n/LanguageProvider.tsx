import React, { createContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import type { Translations } from './locales/types';
import en from './locales/en';
import fr from './locales/fr';
import es from './locales/es';
import de from './locales/de';
import pt from './locales/pt';
import ar from './locales/ar';
import zh from './locales/zh';
import { SUPPORTED_UI_LOCALES } from './constants';

// Re-export legacy alias so existing consumers don't break
export { SUPPORTED_UI_LOCALES as SUPPORTED_LANGUAGES } from './constants';

const locales: Record<string, Translations> = { en, fr, es, de, pt, ar, zh };

// ---------------------------------------------------------------------------
// Missing-key safety: deep-merge any locale over the English base so that
// incomplete or AI-generated locale packs can never break rendering.
// ---------------------------------------------------------------------------
function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result: T = { ...base };
  for (const key in override) {
    const val = override[key as keyof T];
    if (val !== undefined && val !== null) {
      if (typeof val === 'object' && !Array.isArray(val)) {
        result[key as keyof T] = deepMerge(
          base[key as keyof T] as object,
          val as Partial<T[keyof T] & object>,
        ) as T[keyof T];
      } else {
        result[key as keyof T] = val as T[keyof T];
      }
    }
  }
  return result;
}

function buildSafeTranslations(language: string): Translations {
  if (language === 'en') return en;
  const locale = locales[language];
  if (!locale) return en;
  // Deep-merge: any key missing in `locale` falls back to the English value.
  return deepMerge(en, locale as Partial<Translations>);
}

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

  const t = useMemo(() => buildSafeTranslations(language), [language]);

  const dir = useMemo(
    () => SUPPORTED_UI_LOCALES.find(l => l.code === language)?.dir ?? 'ltr',
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

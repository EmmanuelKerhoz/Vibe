import React, { createContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import type { Translations } from './locales/types';
import { SUPPORTED_UI_LOCALES } from './constants';

// Re-export legacy alias so existing consumers don't break
export { SUPPORTED_UI_LOCALES as SUPPORTED_LANGUAGES } from './constants';

const _localeModules = import.meta.glob<Translations>(
  './locales/*.json',
  { eager: true, import: 'default' },
);
const locales: Record<string, Translations> = {};
for (const [path, locale] of Object.entries(_localeModules)) {
  const match = path.match(/\/([A-Za-z0-9-]+)\.json$/);
  if (match?.[1]) locales[match[1].toLowerCase()] = locale;
}
const en: Translations = locales['en'] ?? ({} as Translations);
if (!en || Object.keys(en).length === 0) {
  throw new Error('[i18n] en.json is missing or empty – cannot initialise LanguageProvider.');
}

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

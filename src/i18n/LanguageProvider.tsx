import React, { createContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import type { Translations } from './locales/types';
import { SUPPORTED_UI_LOCALES } from './constants';

// Re-export legacy alias so existing consumers don't break
export { SUPPORTED_UI_LOCALES as SUPPORTED_LANGUAGES } from './constants';

// ---------------------------------------------------------------------------
// Optimized glossary architecture: lazy-load locale files on-demand
// ---------------------------------------------------------------------------
const _localeLoaders = import.meta.glob<Translations>(
  './locales/*.json',
  { import: 'default' },
);

// Cache for loaded locales to avoid re-fetching
const localeCache: Record<string, Translations> = {};

// Async loader function that returns a promise for a locale
async function loadLocale(lang: string): Promise<Translations | null> {
  // Check cache first
  if (localeCache[lang]) {
    return localeCache[lang];
  }

  // Find matching loader
  const loaderKey = Object.keys(_localeLoaders).find(path => {
    const match = path.match(/\/([A-Za-z0-9-]+)\.json$/);
    return match?.[1]?.toLowerCase() === lang.toLowerCase();
  });

  if (!loaderKey) {
    return null;
  }

  try {
    const loader = _localeLoaders[loaderKey];
    if (!loader) {
      return null;
    }
    const locale = await loader();
    localeCache[lang] = locale;
    return locale;
  } catch (error) {
    console.error(`[i18n] Failed to load locale '${lang}':`, error);
    return null;
  }
}

// Preload English as the base/fallback locale
let en: Translations | null = null;
const enPromise = loadLocale('en').then(locale => {
  if (!locale || Object.keys(locale).length === 0) {
    throw new Error('[i18n] en.json is missing or empty – cannot initialise LanguageProvider.');
  }
  en = locale;
  return locale;
});

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

function buildSafeTranslations(language: string, locale: Translations | null): Translations {
  if (!en) {
    throw new Error('[i18n] English base locale not loaded yet');
  }
  if (language === 'en' || !locale) return en;
  // Deep-merge: any key missing in `locale` falls back to the English value.
  return deepMerge(en, locale as Partial<Translations>);
}

export interface LanguageContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: Translations;
  dir: 'ltr' | 'rtl';
  isLoading: boolean;
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

  const [currentLocale, setCurrentLocale] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('lyricist_language', lang);
    } catch {
      // ignore storage errors
    }
  }, []);

  // Load the selected locale asynchronously
  useEffect(() => {
    let cancelled = false;

    const loadLanguage = async () => {
      setIsLoading(true);

      // Ensure English base is loaded first
      await enPromise;

      if (cancelled) return;

      if (language === 'en') {
        setCurrentLocale(en);
        setIsLoading(false);
      } else {
        const locale = await loadLocale(language);
        if (!cancelled) {
          setCurrentLocale(locale);
          setIsLoading(false);
        }
      }
    };

    loadLanguage();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const t = useMemo(() => buildSafeTranslations(language, currentLocale), [language, currentLocale]);

  const dir = useMemo(
    () => SUPPORTED_UI_LOCALES.find(l => l.code === language)?.dir ?? 'ltr',
    [language],
  );

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', dir);
  }, [language, dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, dir, isLoading }),
    [language, setLanguage, t, dir, isLoading],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

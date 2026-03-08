import { useContext } from 'react';
import { LanguageContext } from './LanguageProvider';

export { LanguageProvider, SUPPORTED_LANGUAGES } from './LanguageProvider';
export type { Translations } from './locales/types';
export type { LanguageContextValue } from './LanguageProvider';

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

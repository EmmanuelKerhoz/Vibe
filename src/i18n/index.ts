import { useContext } from 'react';
import { LanguageContext } from './LanguageProvider';

export { LanguageProvider, SUPPORTED_LANGUAGES } from './LanguageProvider';
export {
  SUPPORTED_UI_LOCALES,
  SUPPORTED_ADAPTATION_LANGUAGES,
  adaptationLanguageLabel,
  getLanguageDisplay,
  formatLanguageDisplay,
  migrateToLangId,
  langIdToLocaleCode,
  stripInternalPrefix,
  CUSTOM_LANGUAGE_VALUE,
  isCustomAdaptationLanguage,
  CUSTOM_LANG_ID_PREFIX,
  isCustomLangId,
  buildCustomLangId,
  readCustomLangText,
  langIdToAiName,
  migrateAdaptationToLangId,
  getAdaptationLanguageByLangId,
} from './constants';
export type { UiLocaleInfo, AdaptationLanguage, SupportedUiLocaleCode, LangId } from './constants';
export type { Translations } from './locales/types';
export type { LanguageContextValue } from './LanguageProvider';

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export const useLanguage = useTranslation;

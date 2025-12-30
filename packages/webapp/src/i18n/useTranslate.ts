import { useUser } from '../store/UserContext';
import { translations, type TranslationKey } from './translations';
import { DEFAULT_LANGUAGE, type LanguageCode } from '../config/languages';

/**
 * Custom hook for translating UI strings
 * 
 * Usage:
 * const t = useTranslate();
 * return <h1>{t('login_title')}</h1>
 * 
 * With language override (for login page before user is authenticated):
 * const t = useTranslate(selectedLanguage);
 * 
 * Features:
 * - Type-safe: TypeScript will catch invalid keys
 * - Automatic language detection from user preferences
 * - Falls back to English if translation missing
 * - Supports language override for pre-authentication screens
 * - Zero dependencies
 */
export function useTranslate(languageOverride?: LanguageCode) {
  const { user } = useUser();
  
  // Use override if provided (for LoginPage), otherwise use user preference
  const language = languageOverride || (user?.preferences?.language as LanguageCode) || DEFAULT_LANGUAGE;
  
  return (key: TranslationKey): string => {
    // Get translation for user's language, fallback to English
    return translations[language]?.[key] || translations[DEFAULT_LANGUAGE][key];
  };
}


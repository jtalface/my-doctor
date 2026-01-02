import { useAuth } from '../auth';
import { translations, type TranslationKey } from './translations';
import { DEFAULT_LANGUAGE, type LanguageCode } from '../config/languages';

/**
 * Custom hook for translating UI strings
 * 
 * Usage:
 * const t = useTranslate();
 * return <h1>{t('login_title')}</h1>
 * 
 * With parameters:
 * return <p>{t('greeting', { name: 'John' })}</p>
 * // For a translation like: greeting: 'Hello, {{name}}!'
 * 
 * With language override (for login page before user is authenticated):
 * const t = useTranslate(selectedLanguage);
 * 
 * Features:
 * - Type-safe: TypeScript will catch invalid keys
 * - Automatic language detection from user preferences
 * - Falls back to English if translation missing
 * - Supports language override for pre-authentication screens
 * - Supports parameter interpolation with {{param}} syntax
 * - Zero dependencies
 */
export function useTranslate(languageOverride?: LanguageCode) {
  const { user } = useAuth();
  
  // Use override if provided (for LoginPage), otherwise use user preference
  const language = languageOverride || (user?.preferences?.language as LanguageCode) || DEFAULT_LANGUAGE;
  
  return (key: TranslationKey, params?: Record<string, string | number>): string => {
    // Get translation for user's language, fallback to English
    let translated: string = translations[language]?.[key] || translations[DEFAULT_LANGUAGE][key];
    
    // If params provided, replace {{param}} with actual values
    if (params && translated) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translated = translated.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(value));
      });
    }
    
    return translated;
  };
}

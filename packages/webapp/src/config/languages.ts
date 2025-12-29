/**
 * Supported languages configuration
 * Centralized source of truth for multi-language support
 */

export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  sw: {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    flag: '🇹🇿',
  },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/**
 * Validates if a language code is supported
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES;
}

/**
 * Gets language info or returns default if invalid
 */
export function getLanguageInfo(code: string) {
  return isValidLanguageCode(code) 
    ? SUPPORTED_LANGUAGES[code] 
    : SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
}

/**
 * Gets all supported languages as an array
 */
export function getAllLanguages() {
  return Object.values(SUPPORTED_LANGUAGES);
}


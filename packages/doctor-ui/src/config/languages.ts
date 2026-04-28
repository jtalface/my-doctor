/**
 * Supported UI languages for doctor-ui (subset of patient webapp).
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
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: LanguageCode = 'pt';

export function isValidLanguageCode(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES;
}

export function normalizeLanguage(code: string | undefined | null): LanguageCode {
  if (code === 'en') return 'en';
  return 'pt';
}

export function getAllLanguages() {
  return Object.values(SUPPORTED_LANGUAGES);
}

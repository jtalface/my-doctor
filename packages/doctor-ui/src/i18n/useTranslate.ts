import { useMemo } from 'react';
import { translations, type TranslationKey } from './translations';
import { DEFAULT_LANGUAGE, type LanguageCode } from '../config/languages';
import { useLanguage } from './LanguageProvider';

type TranslateFn = {
  (key: TranslationKey, params?: Record<string, string | number>): string;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  language: LanguageCode;
};

export function useTranslate(): TranslateFn {
  const { language } = useLanguage();

  return useMemo(() => {
    const translateFn = (
      key: TranslationKey,
      params?: Record<string, string | number>,
    ): string => {
      let str: string =
        translations[language]?.[key] ?? translations[DEFAULT_LANGUAGE][key];
      if (params && str) {
        Object.entries(params).forEach(([paramKey, value]) => {
          str = str.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(value));
        });
      }
      return str;
    };
    return Object.assign(translateFn, {
      t: translateFn,
      language,
    }) as TranslateFn;
  }, [language]);
}

import type { LanguageCode } from '../config/languages';
import en from './en.json';
import fr from './fr.json';
import pt from './pt-PT.json';
import sw from './sw.json';

const bundles = { pt, en, fr, sw } as const;
type PreventiveKey = keyof typeof pt;
export type PreventiveTextKey = PreventiveKey;

export function getPreventiveText(language: string, key: PreventiveKey): string {
  const lang = (language in bundles ? language : 'pt') as LanguageCode;
  return bundles[lang][key] || bundles.pt[key];
}

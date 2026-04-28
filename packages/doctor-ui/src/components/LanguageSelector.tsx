import { getAllLanguages, type LanguageCode } from '../config/languages';
import styles from './LanguageSelector.module.css';

type Props = {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  id?: string;
  className?: string;
  'aria-label'?: string;
};

export function LanguageSelector({ value, onChange, id, className, 'aria-label': ariaLabel }: Props) {
  const languages = getAllLanguages();

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as LanguageCode)}
      className={[styles.select, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.nativeName}
        </option>
      ))}
    </select>
  );
}

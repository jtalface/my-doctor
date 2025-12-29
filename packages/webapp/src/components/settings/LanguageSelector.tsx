import { getAllLanguages, type LanguageCode } from '../../config/languages';
import styles from './LanguageSelector.module.css';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: LanguageCode) => void;
  variant?: 'compact' | 'expanded';
}

export function LanguageSelector({ value, onChange, variant = 'compact' }: LanguageSelectorProps) {
  const languages = getAllLanguages();

  if (variant === 'expanded') {
    return (
      <div className={styles.container}>
        <div className={styles.options}>
          {languages.map((lang) => (
            <label key={lang.code} className={styles.option}>
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={value === lang.code}
                onChange={(e) => onChange(e.target.value as LanguageCode)}
                className={styles.radio}
              />
              <div className={styles.optionContent}>
                <span className={styles.flag}>{lang.flag}</span>
                <div className={styles.optionText}>
                  <span className={styles.nativeName}>{lang.nativeName}</span>
                  <span className={styles.englishName}>{lang.name}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LanguageCode)}
      className={styles.selectCompact}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.nativeName}
        </option>
      ))}
    </select>
  );
}


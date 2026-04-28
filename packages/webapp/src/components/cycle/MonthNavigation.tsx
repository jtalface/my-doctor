import { useTranslate } from '../../i18n';
import styles from './MonthNavigation.module.css';

interface MonthNavigationProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

function capitalizeFirstLetter(value: string): string {
  return value.replace(/^(\s*\p{L})/u, (firstLetter) => firstLetter.toUpperCase());
}

export function MonthNavigation({ year, month, onPrevMonth, onNextMonth, onToday }: MonthNavigationProps) {
  const t = useTranslate();
  const localeByLanguage: Record<string, string> = {
    en: 'en-US',
    pt: 'pt-PT',
    fr: 'fr-FR',
    sw: 'sw-TZ',
  };
  const locale = localeByLanguage[t.language] || 'en-US';

  const monthName = capitalizeFirstLetter(new Date(year, month).toLocaleDateString(locale, {
    month: 'long', 
    year: 'numeric' 
  }));
  
  return (
    <div className={styles.navigation}>
      <button 
        className={styles.button} 
        onClick={onPrevMonth}
        type="button"
        aria-label={t('cycle_prev_month')}
      >
        ←
      </button>
      
      <h2 className={styles.monthName}>{monthName}</h2>
      
      <button 
        className={styles.button} 
        onClick={onNextMonth}
        type="button"
        aria-label={t('cycle_next_month')}
      >
        →
      </button>
      
      <button 
        className={styles.todayButton} 
        onClick={onToday}
        type="button"
      >
        {t('cycle_today')}
      </button>
    </div>
  );
}


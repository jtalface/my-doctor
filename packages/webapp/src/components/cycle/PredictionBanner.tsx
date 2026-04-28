import type { Prediction } from '../../types/cycle';
import { isRegularPrediction } from '../../types/cycle';
import { useTranslate } from '../../i18n';
import styles from './PredictionBanner.module.css';

interface PredictionBannerProps {
  predictions: Prediction;
}

function parseDateKeyAsLocal(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function capitalizeFirstLetter(value: string): string {
  return value.replace(/^(\s*\p{L})/u, (firstLetter) => firstLetter.toUpperCase());
}

function formatDate(dateStr: string, language: string): string {
  const localeByLanguage: Record<string, string> = {
    en: 'en-US',
    pt: 'pt-PT',
    fr: 'fr-FR',
    sw: 'sw-TZ',
  };
  const locale = localeByLanguage[language] || 'en-US';
  const date = parseDateKeyAsLocal(dateStr);
  return capitalizeFirstLetter(date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }));
}

function calculateDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = parseDateKeyAsLocal(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function PredictionBanner({ predictions }: PredictionBannerProps) {
  const t = useTranslate();
  
  if (isRegularPrediction(predictions)) {
    const daysUntilPeriod = calculateDaysUntil(predictions.nextPeriod.start);
    
    return (
      <div className={styles.banner}>
        <div className={styles.mainPrediction}>
          <span className={styles.icon}>🌸</span>
          <div className={styles.content}>
            <h3 className={styles.title}>
              {daysUntilPeriod > 0 
                ? t('cycle_prediction_in_days', { count: daysUntilPeriod })
                : t('cycle_prediction_today')
              }
            </h3>
            <p className={styles.subtitle}>
              {formatDate(predictions.nextPeriod.start, t.language)} - {formatDate(predictions.nextPeriod.end, t.language)}
            </p>
          </div>
        </div>
        
        <div className={styles.secondaryInfo}>
          <div className={styles.infoItem}>
            <span className={styles.label}>{t('cycle_fertile_window')}:</span>
            <span className={styles.value}>
              {formatDate(predictions.fertileWindow.start, t.language)} - {formatDate(predictions.fertileWindow.end, t.language)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>{t('cycle_ovulation')}:</span>
            <span className={styles.value}>{formatDate(predictions.ovulation.date, t.language)}</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Irregular cycle
  const daysUntilPeriod = calculateDaysUntil(predictions.nextPeriod.startRange.min);
  
  return (
    <div className={`${styles.banner} ${styles.irregular}`}>
      <div className={styles.mainPrediction}>
        <span className={styles.icon}>🌸</span>
        <div className={styles.content}>
          <h3 className={styles.title}>
            {t('cycle_prediction_around_days', { count: daysUntilPeriod })}
          </h3>
          <p className={styles.subtitle}>
            {formatDate(predictions.nextPeriod.startRange.min, t.language)} - {formatDate(predictions.nextPeriod.endRange.max, t.language)} {t('cycle_estimated_range')}
          </p>
        </div>
      </div>
      
      <div className={styles.secondaryInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>{t('cycle_fertile_window_approx')}:</span>
          <span className={styles.value}>
            {formatDate(predictions.fertileWindow.start, t.language)} - {formatDate(predictions.fertileWindow.end, t.language)}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>{t('cycle_ovulation_approx')}:</span>
          <span className={styles.value}>
            {formatDate(predictions.ovulation.dateRange.min, t.language)} - {formatDate(predictions.ovulation.dateRange.max, t.language)}
          </span>
        </div>
      </div>
    </div>
  );
}


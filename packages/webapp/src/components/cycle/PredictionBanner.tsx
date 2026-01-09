import type { Prediction } from '../../types/cycle';
import { isRegularPrediction } from '../../types/cycle';
import styles from './PredictionBanner.module.css';

interface PredictionBannerProps {
  predictions: Prediction;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function PredictionBanner({ predictions }: PredictionBannerProps) {
  if (isRegularPrediction(predictions)) {
    const daysUntilPeriod = calculateDaysUntil(predictions.nextPeriod.start);
    
    return (
      <div className={styles.banner}>
        <div className={styles.mainPrediction}>
          <span className={styles.icon}>🌸</span>
          <div className={styles.content}>
            <h3 className={styles.title}>
              {daysUntilPeriod > 0 ? `Period expected in ${daysUntilPeriod} days` : 'Period expected today'}
            </h3>
            <p className={styles.subtitle}>
              {formatDate(predictions.nextPeriod.start)} - {formatDate(predictions.nextPeriod.end)}
            </p>
          </div>
        </div>
        
        <div className={styles.secondaryInfo}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Fertile window:</span>
            <span className={styles.value}>
              {formatDate(predictions.fertileWindow.start)} - {formatDate(predictions.fertileWindow.end)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Ovulation:</span>
            <span className={styles.value}>{formatDate(predictions.ovulation.date)}</span>
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
            Period expected around {daysUntilPeriod} days
          </h3>
          <p className={styles.subtitle}>
            {formatDate(predictions.nextPeriod.startRange.min)} - {formatDate(predictions.nextPeriod.endRange.max)} (estimated range)
          </p>
        </div>
      </div>
      
      <div className={styles.secondaryInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>Fertile window (approx):</span>
          <span className={styles.value}>
            {formatDate(predictions.fertileWindow.start)} - {formatDate(predictions.fertileWindow.end)}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Ovulation (approx):</span>
          <span className={styles.value}>
            {formatDate(predictions.ovulation.dateRange.min)} - {formatDate(predictions.ovulation.dateRange.max)}
          </span>
        </div>
      </div>
    </div>
  );
}


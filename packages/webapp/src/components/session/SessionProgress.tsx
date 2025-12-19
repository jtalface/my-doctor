import { clsx } from 'clsx';
import styles from './SessionProgress.module.css';

export interface SessionProgressProps {
  current: number;
  total: number;
  label?: string;
  variant?: 'bar' | 'steps' | 'percentage';
  className?: string;
}

export function SessionProgress({
  current,
  total,
  label,
  variant = 'bar',
  className,
}: SessionProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div 
      className={clsx(styles.progress, className)}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label || `Progress: ${current} of ${total}`}
    >
      {variant === 'bar' && (
        <>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={styles.label}>
            {label || `${percentage}%`}
          </span>
        </>
      )}

      {variant === 'percentage' && (
        <div className={styles.percentageContainer}>
          <span className={styles.percentageValue}>{percentage}%</span>
          {label && <span className={styles.percentageLabel}>{label}</span>}
        </div>
      )}

      {variant === 'steps' && (
        <div className={styles.stepsContainer}>
          <span className={styles.stepsValue}>
            {current} of {total}
          </span>
          {label && <span className={styles.stepsLabel}>{label}</span>}
        </div>
      )}
    </div>
  );
}


import styles from './MonthNavigation.module.css';

interface MonthNavigationProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function MonthNavigation({ year, month, onPrevMonth, onNextMonth, onToday }: MonthNavigationProps) {
  const monthName = new Date(year, month).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  return (
    <div className={styles.navigation}>
      <button 
        className={styles.button} 
        onClick={onPrevMonth}
        type="button"
        aria-label="Previous month"
      >
        ←
      </button>
      
      <h2 className={styles.monthName}>{monthName}</h2>
      
      <button 
        className={styles.button} 
        onClick={onNextMonth}
        type="button"
        aria-label="Next month"
      >
        →
      </button>
      
      <button 
        className={styles.todayButton} 
        onClick={onToday}
        type="button"
      >
        Today
      </button>
    </div>
  );
}


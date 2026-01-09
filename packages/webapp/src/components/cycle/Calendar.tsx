import { useMemo } from 'react';
import type { CalendarMonth } from '../../types/cycle';
import styles from './Calendar.module.css';

interface CalendarProps {
  calendarMonth: CalendarMonth;
  onDayClick?: (date: string) => void;
  selectedDate?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar({ calendarMonth, onDayClick, selectedDate }: CalendarProps) {
  const { year, month, days } = calendarMonth;
  
  const monthName = useMemo(() => {
    return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [year, month]);
  
  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <h2 className={styles.monthName}>{monthName}</h2>
      </div>
      
      <div className={styles.weekdays}>
        {WEEKDAYS.map(day => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>
      
      <div className={styles.days}>
        {days.map(dayInfo => {
          const date = new Date(dayInfo.date);
          const dayOfMonth = date.getDate();
          const isCurrentMonth = date.getMonth() === month;
          const isToday = dayInfo.date === new Date().toISOString().split('T')[0];
          const isSelected = dayInfo.date === selectedDate;
          
          const dayClasses = [
            styles.day,
            !isCurrentMonth && styles.otherMonth,
            isToday && styles.today,
            isSelected && styles.selected,
            dayInfo.isPeriodDay && styles.periodDay,
            dayInfo.isPredictedPeriod && styles.predictedPeriod,
            dayInfo.isFertileWindow && styles.fertileWindow,
            dayInfo.isOvulation && styles.ovulation,
            onDayClick && styles.clickable,
          ].filter(Boolean).join(' ');
          
          return (
            <button
              key={dayInfo.date}
              className={dayClasses}
              onClick={() => onDayClick?.(dayInfo.date)}
              disabled={!onDayClick}
              type="button"
            >
              <span className={styles.dayNumber}>{dayOfMonth}</span>
              {dayInfo.log && (
                <div className={styles.indicators}>
                  {dayInfo.log.symptoms.length > 0 && (
                    <span className={styles.indicator} title="Has symptoms">•</span>
                  )}
                  {dayInfo.log.mood.length > 0 && (
                    <span className={styles.indicator} title="Has mood log">•</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.periodDay}`}></span>
          <span>Period</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.predictedPeriod}`}></span>
          <span>Predicted</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.fertileWindow}`}></span>
          <span>Fertile</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.ovulation}`}></span>
          <span>Ovulation</span>
        </div>
      </div>
    </div>
  );
}


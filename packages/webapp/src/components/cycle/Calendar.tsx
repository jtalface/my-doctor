import { useMemo } from 'react';
import type { CalendarMonth } from '../../types/cycle';
import { useTranslate } from '../../i18n';
import styles from './Calendar.module.css';

interface CalendarProps {
  calendarMonth: CalendarMonth;
  onDayClick?: (date: string) => void;
  selectedDate?: string;
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKeyAsLocal(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function capitalizeFirstLetter(value: string): string {
  return value.replace(/^(\s*\p{L})/u, (firstLetter) => firstLetter.toUpperCase());
}

export function Calendar({ calendarMonth, onDayClick, selectedDate }: CalendarProps) {
  const t = useTranslate();
  const { year, month, days } = calendarMonth;
  const localeByLanguage: Record<string, string> = {
    en: 'en-US',
    pt: 'pt-PT',
    fr: 'fr-FR',
    sw: 'sw-TZ',
  };
  const locale = localeByLanguage[t.language] || 'en-US';
  
  const monthName = useMemo(() => {
    const formatted = new Date(year, month).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return capitalizeFirstLetter(formatted);
  }, [year, month, locale]);

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2023-01-01 is Sunday; iterate through a known Sunday-start week.
    return Array.from({ length: 7 }, (_, i) =>
      capitalizeFirstLetter(formatter.format(new Date(2023, 0, 1 + i)))
    );
  }, [locale]);
  
  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <h2 className={styles.monthName}>{monthName}</h2>
      </div>
      
      <div className={styles.weekdays}>
        {weekdays.map(day => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>
      
      <div className={styles.days}>
        {days.map(dayInfo => {
          const date = parseDateKeyAsLocal(dayInfo.date);
          const dayOfMonth = date.getDate();
          const isCurrentMonth = date.getMonth() === month;
          const isToday = dayInfo.date === toLocalDateKey(new Date());
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
          <span>{t('cycle_calendar_period')}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.predictedPeriod}`}></span>
          <span>{t('cycle_calendar_predicted')}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.fertileWindow}`}></span>
          <span>{t('cycle_calendar_fertile')}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.ovulation}`}></span>
          <span>{t('cycle_calendar_ovulation')}</span>
        </div>
      </div>
    </div>
  );
}


/**
 * useCycleCalendar Hook
 * 
 * Generates calendar data with period tracking information:
 * - Actual period days (from logs)
 * - Predicted period days
 * - Fertile window
 * - Ovulation day
 */

import { useMemo } from 'react';
import type { DailyLog, Prediction, DayInfo, CalendarMonth } from '../types/cycle';
import { isRegularPrediction, isIrregularPrediction } from '../types/cycle';

/**
 * Date utility: format Date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Date utility: parse YYYY-MM-DD to Date
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date is within a date range
 */
function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/**
 * Generate calendar days for a specific month
 */
function generateMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from the first day of the week containing the first day of the month
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Go back to Sunday
  
  // End on the last day of the week containing the last day of the month
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay())); // Go forward to Saturday
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

interface UseCycleCalendarOptions {
  year: number;
  month: number;                        // 0-11 (JavaScript month)
  dailyLogs: DailyLog[];
  predictions: Prediction | null;
}

export function useCycleCalendar(options: UseCycleCalendarOptions): CalendarMonth {
  const { year, month, dailyLogs, predictions } = options;
  
  const calendarMonth = useMemo((): CalendarMonth => {
    const days = generateMonthDays(year, month);
    
    // Create a map of date -> DailyLog for quick lookup
    const logMap = new Map<string, DailyLog>();
    dailyLogs.forEach(log => {
      logMap.set(log.date, log);
    });
    
    // Parse prediction dates
    let predictedPeriodDates = new Set<string>();
    let fertileWindowDates = new Set<string>();
    let ovulationDates = new Set<string>();
    
    if (predictions) {
      if (isRegularPrediction(predictions)) {
        // Add all dates in predicted period range
        let currentDate = parseDate(predictions.nextPeriod.start);
        const endDate = parseDate(predictions.nextPeriod.end);
        
        while (currentDate <= endDate) {
          predictedPeriodDates.add(formatDate(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Add fertile window dates
        let fertileDate = parseDate(predictions.fertileWindow.start);
        const fertileEndDate = parseDate(predictions.fertileWindow.end);
        
        while (fertileDate <= fertileEndDate) {
          fertileWindowDates.add(formatDate(fertileDate));
          fertileDate.setDate(fertileDate.getDate() + 1);
        }
        
        // Add ovulation date
        ovulationDates.add(predictions.ovulation.date);
      } else if (isIrregularPrediction(predictions)) {
        // For irregular cycles, use the middle of the range
        const predictedStart = parseDate(predictions.nextPeriod.startRange.min);
        const predictedEnd = parseDate(predictions.nextPeriod.endRange.max);
        
        let currentDate = new Date(predictedStart);
        while (currentDate <= predictedEnd) {
          predictedPeriodDates.add(formatDate(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Fertile window
        let fertileDate = parseDate(predictions.fertileWindow.start);
        const fertileEndDate = parseDate(predictions.fertileWindow.end);
        
        while (fertileDate <= fertileEndDate) {
          fertileWindowDates.add(formatDate(fertileDate));
          fertileDate.setDate(fertileDate.getDate() + 1);
        }
        
        // Ovulation range - use middle date
        const ovulationStart = parseDate(predictions.ovulation.dateRange.min);
        const ovulationEnd = parseDate(predictions.ovulation.dateRange.max);
        const midOvulation = new Date(
          (ovulationStart.getTime() + ovulationEnd.getTime()) / 2
        );
        ovulationDates.add(formatDate(midOvulation));
      }
    }
    
    // Build DayInfo for each calendar day
    const dayInfos: DayInfo[] = days.map(date => {
      const dateStr = formatDate(date);
      const log = logMap.get(dateStr);
      
      return {
        date: dateStr,
        isPeriodDay: log?.isPeriodDay || false,
        isPredictedPeriod: predictedPeriodDates.has(dateStr) && !log?.isPeriodDay,
        isFertileWindow: fertileWindowDates.has(dateStr),
        isOvulation: ovulationDates.has(dateStr),
        log: log || null,
      };
    });
    
    return {
      year,
      month,
      days: dayInfos,
    };
  }, [year, month, dailyLogs, predictions]);
  
  return calendarMonth;
}


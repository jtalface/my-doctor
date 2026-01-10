/**
 * Date Utilities Tests
 * 
 * Tests pure date formatting and calculation functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  parseDate,
  calculateAge,
  calculateDaysUntil,
  formatDateShort,
  isDateInPast,
  isToday,
} from '../date';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('formats date to YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('pads single digit month and day', () => {
      const date = new Date(2024, 8, 5); // September 5, 2024
      expect(formatDate(date)).toBe('2024-09-05');
    });

    it('handles end of year', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      expect(formatDate(date)).toBe('2024-12-31');
    });

    it('handles start of year', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      expect(formatDate(date)).toBe('2024-01-01');
    });
  });

  describe('parseDate', () => {
    it('parses YYYY-MM-DD to Date', () => {
      const date = parseDate('2024-01-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it('handles different months', () => {
      const date = parseDate('2024-12-25');
      expect(date.getMonth()).toBe(11); // December is 11
      expect(date.getDate()).toBe(25);
    });

    it('roundtrip formatting works', () => {
      const original = '2024-06-15';
      const parsed = parseDate(original);
      const formatted = formatDate(parsed);
      expect(formatted).toBe(original);
    });
  });

  describe('calculateAge', () => {
    beforeEach(() => {
      // Mock today as January 15, 2024
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 15));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calculates age from date string', () => {
      expect(calculateAge('2010-01-15')).toBe(14);
      expect(calculateAge('2000-01-15')).toBe(24);
      expect(calculateAge('1990-01-15')).toBe(34);
    });

    it('calculates age from Date object', () => {
      expect(calculateAge(new Date(2010, 0, 15))).toBe(14);
    });

    it('handles birthday not yet occurred this year', () => {
      // Birthday is March 15, today is January 15
      expect(calculateAge('2010-03-15')).toBe(13); // Still 13, not 14 yet
    });

    it('handles birthday already occurred this year', () => {
      // Birthday is January 1, today is January 15
      expect(calculateAge('2010-01-01')).toBe(14); // Already 14
    });

    it('handles birthday today', () => {
      expect(calculateAge('2010-01-15')).toBe(14);
    });

    it('handles same day different month', () => {
      // Birthday is on the 15th but different month
      expect(calculateAge('2010-12-15')).toBe(13); // Birthday hasn't happened yet
      expect(calculateAge('2010-01-15')).toBe(14); // Birthday is today
    });

    it('returns 0 for birth this year', () => {
      expect(calculateAge('2024-01-01')).toBe(0);
    });
  });

  describe('calculateDaysUntil', () => {
    beforeEach(() => {
      // Mock today as January 15, 2024
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 15));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calculates days until future date', () => {
      expect(calculateDaysUntil('2024-01-20')).toBe(5);
      expect(calculateDaysUntil('2024-01-25')).toBe(10);
    });

    it('returns 0 for today', () => {
      expect(calculateDaysUntil('2024-01-15')).toBe(0);
    });

    it('returns negative for past dates', () => {
      expect(calculateDaysUntil('2024-01-10')).toBe(-5);
      expect(calculateDaysUntil('2024-01-01')).toBe(-14);
    });

    it('handles dates in different months', () => {
      expect(calculateDaysUntil('2024-02-15')).toBe(31); // 31 days in January
    });

    it('works with Date objects', () => {
      expect(calculateDaysUntil(new Date(2024, 0, 20))).toBe(5);
    });
  });

  describe('formatDateShort', () => {
    it('formats date in short format', () => {
      expect(formatDateShort('2024-01-15')).toBe('Jan 15');
      expect(formatDateShort('2024-12-25')).toBe('Dec 25');
    });

    it('handles different months', () => {
      expect(formatDateShort('2024-03-05')).toBe('Mar 5');
      expect(formatDateShort('2024-06-20')).toBe('Jun 20');
    });
  });

  describe('isDateInPast', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 15)); // January 15, 2024
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for past dates', () => {
      expect(isDateInPast('2024-01-10')).toBe(true);
      expect(isDateInPast('2023-12-31')).toBe(true);
    });

    it('returns false for today', () => {
      expect(isDateInPast('2024-01-15')).toBe(false);
    });

    it('returns false for future dates', () => {
      expect(isDateInPast('2024-01-20')).toBe(false);
      expect(isDateInPast('2024-02-01')).toBe(false);
    });

    it('works with Date objects', () => {
      expect(isDateInPast(new Date(2024, 0, 10))).toBe(true);
      expect(isDateInPast(new Date(2024, 0, 20))).toBe(false);
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 15, 10, 30)); // January 15, 2024, 10:30 AM
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for today', () => {
      expect(isToday('2024-01-15')).toBe(true);
      expect(isToday(new Date(2024, 0, 15))).toBe(true);
    });

    it('returns false for yesterday', () => {
      expect(isToday('2024-01-14')).toBe(false);
    });

    it('returns false for tomorrow', () => {
      expect(isToday('2024-01-16')).toBe(false);
    });

    it('ignores time component', () => {
      expect(isToday(new Date(2024, 0, 15, 23, 59))).toBe(true);
      expect(isToday(new Date(2024, 0, 15, 0, 0))).toBe(true);
    });
  });
});


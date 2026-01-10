/**
 * Calendar Component Tests
 * 
 * Tests the cycle tracker calendar component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../__tests__/test-utils';
import { Calendar } from '../Calendar';
import type { CalendarMonth } from '../../../types/cycle';

describe('Calendar Component', () => {
  const mockCalendarMonth: CalendarMonth = {
    year: 2024,
    month: 0, // January
    days: [
      {
        date: '2024-01-01',
        isPeriodDay: false,
        isPredictedPeriod: false,
        isFertileWindow: false,
        isOvulation: false,
        log: null,
      },
      {
        date: '2024-01-15',
        isPeriodDay: true,
        isPredictedPeriod: false,
        isFertileWindow: false,
        isOvulation: false,
        log: null,
      },
      {
        date: '2024-01-20',
        isPeriodDay: false,
        isPredictedPeriod: false,
        isFertileWindow: true,
        isOvulation: false,
        log: null,
      },
      {
        date: '2024-01-22',
        isPeriodDay: false,
        isPredictedPeriod: false,
        isFertileWindow: true,
        isOvulation: true,
        log: null,
      },
    ],
  };

  describe('Rendering', () => {
    it('renders month and year', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      expect(screen.getByText(/january 2024/i)).toBeInTheDocument();
    });

    it('renders weekday headers', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('renders all days', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(mockCalendarMonth.days.length);
    });

    it('renders day numbers', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('22')).toBeInTheDocument();
    });
  });

  describe('Day Styling', () => {
    it('applies period day styling', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      const dayButtons = screen.getAllByRole('button');
      const periodDay = dayButtons.find(btn => btn.textContent === '15');
      
      expect(periodDay?.className).toContain('periodDay');
    });

    it('applies fertile window styling', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      const dayButtons = screen.getAllByRole('button');
      const fertileDay = dayButtons.find(btn => btn.textContent === '20');
      
      expect(fertileDay?.className).toContain('fertileWindow');
    });

    it('applies ovulation styling', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      const dayButtons = screen.getAllByRole('button');
      const ovulationDay = dayButtons.find(btn => btn.textContent === '22');
      
      expect(ovulationDay?.className).toContain('ovulation');
    });

    it('applies selected styling when date is selected', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} selectedDate="2024-01-15" />);
      
      const dayButtons = screen.getAllByRole('button');
      const selectedDay = dayButtons.find(btn => btn.textContent === '15');
      
      expect(selectedDay?.className).toContain('selected');
    });
  });

  describe('Day Click Interaction', () => {
    it('calls onDayClick when day is clicked', async () => {
      const user = userEvent.setup();
      const handleDayClick = vi.fn();
      
      render(<Calendar calendarMonth={mockCalendarMonth} onDayClick={handleDayClick} />);
      
      const dayButtons = screen.getAllByRole('button');
      const firstDay = dayButtons[0];
      
      await user.click(firstDay);
      
      expect(handleDayClick).toHaveBeenCalledWith('2024-01-01');
    });

    it('does not call onDayClick when not provided', async () => {
      const user = userEvent.setup();
      
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      const dayButtons = screen.getAllByRole('button');
      const firstDay = dayButtons[0];
      
      // Should not throw error
      await user.click(firstDay);
    });

    it('disables buttons when onDayClick not provided', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      const dayButtons = screen.getAllByRole('button');
      dayButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('enables buttons when onDayClick is provided', () => {
      const handleDayClick = vi.fn();
      
      render(<Calendar calendarMonth={mockCalendarMonth} onDayClick={handleDayClick} />);
      
      const dayButtons = screen.getAllByRole('button');
      dayButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Log Indicators', () => {
    const monthWithLogs: CalendarMonth = {
      year: 2024,
      month: 0,
      days: [
        {
          date: '2024-01-01',
          isPeriodDay: false,
          isPredictedPeriod: false,
          isFertileWindow: false,
          isOvulation: false,
          log: {
            userId: 'user-1',
            date: '2024-01-01',
            flow: null,
            symptoms: ['cramps', 'headache'],
            mood: ['happy'],
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    };

    it('shows indicator when day has symptoms', () => {
      render(<Calendar calendarMonth={monthWithLogs} />);
      
      const indicator = screen.getByTitle(/has symptoms/i);
      expect(indicator).toBeInTheDocument();
    });

    it('shows indicator when day has mood log', () => {
      render(<Calendar calendarMonth={monthWithLogs} />);
      
      const indicator = screen.getByTitle(/has mood log/i);
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('shows legend', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      expect(screen.getByText(/period/i)).toBeInTheDocument();
      expect(screen.getByText(/fertile/i)).toBeInTheDocument();
      expect(screen.getByText(/ovulation/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('all days are buttons', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('buttons have type="button"', () => {
      render(<Calendar calendarMonth={mockCalendarMonth} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});


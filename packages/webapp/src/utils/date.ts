/**
 * Date Utilities
 * 
 * Pure functions for date formatting and calculations
 */

/**
 * Format Date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD to Date (using local timezone)
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // Ensure we're in local timezone at midnight
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate days until a target date
 */
export function calculateDaysUntil(targetDate: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = typeof targetDate === 'string' ? parseDate(targetDate) : new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display (short format)
 */
export function formatDateShort(dateStr: string): string {
  const date = parseDate(dateStr); // Use parseDate to handle timezone consistently
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Check if date is in the past
 */
export function isDateInPast(date: string | Date): boolean {
  const target = typeof date === 'string' ? parseDate(date) : new Date(date);
  target.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return target < today;
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const target = typeof date === 'string' ? parseDate(date) : new Date(date);
  const today = new Date();
  
  return target.getFullYear() === today.getFullYear() &&
         target.getMonth() === today.getMonth() &&
         target.getDate() === today.getDate();
}


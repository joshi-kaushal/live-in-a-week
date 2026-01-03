import { format, parseISO, startOfWeek, endOfWeek, addDays, isToday, isSameDay } from 'date-fns';

/**
 * Format date for display
 */
export function formatDisplayDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

/**
 * Format date for input value (YYYY-MM-DD)
 */
export function formatInputDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get week boundaries for a given date
 */
export function getWeekBoundaries(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date),
    end: endOfWeek(date),
  };
}

/**
 * Get all days in a week
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/**
 * Check if date is today
 */
export function isDateToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
}

/**
 * Check if two dates are the same day
 */
export function isSameDate(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isSameDay(d1, d2);
}

/**
 * Get relative date description (Today, Tomorrow, etc)
 */
export function getRelativeDateLabel(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  if (isToday(d)) return 'Today';
  if (isSameDay(d, tomorrow)) return 'Tomorrow';
  
  return format(d, 'EEE, MMM d');
}

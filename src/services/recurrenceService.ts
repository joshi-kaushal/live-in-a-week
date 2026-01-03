import { addDays, addWeeks, addMonths, addYears, parseISO, format } from 'date-fns';
import { Task, RecurrencePattern, RecurringTaskTemplate } from '../types/task';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate task instances from a recurring template for a date range
 * Used when navigating to future weeks/months
 */
export function generateRecurringInstances(
  template: RecurringTaskTemplate,
  startDate: string,
  endDate: string
): Task[] {
  const instances: Task[] = [];
  const { recurrence } = template;

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  let current = parseISO(template.createdAt.split('T')[0]); // Start from creation
  const templateEndDate = recurrence.endDate ? parseISO(recurrence.endDate) : null;

  while (current <= end) {
    // Check if within requested range and within recurrence end date
    if (current >= start && (!templateEndDate || current <= templateEndDate)) {
      // Check if not in exceptions
      if (!recurrence.exceptions?.includes(format(current, 'yyyy-MM-dd'))) {
        // Check if matches recurrence pattern
        if (matchesRecurrencePattern(current, recurrence)) {
          const instance: Task = {
            id: uuidv4(),
            title: template.title,
            description: template.description,
            status: 'pending',
            energyLevel: template.energyLevel,
            priority: template.priority,
            dueDate: format(current, 'yyyy-MM-dd'),
            dueTime: template.reminders?.[0]?.customMinutesBefore ? '09:00' : undefined,
            reminders: template.reminders,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentTaskId: template.id,
            instanceDate: format(current, 'yyyy-MM-dd'),
            syncStatus: 'pending',
            localVersion: 1,
          };

          instances.push(instance);
        }
      }
    }

    // Move to next possible occurrence
    current = getNextOccurrence(current, recurrence);

    if (current > end || (templateEndDate && current > templateEndDate)) {
      break;
    }
  }

  return instances;
}

/**
 * Get next occurrence date based on recurrence pattern
 */
function getNextOccurrence(current: Date, pattern: RecurrencePattern): Date {
  switch (pattern.frequency) {
    case 'daily':
      return addDays(current, pattern.interval);

    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        // Find next matching day of week
        let next = addDays(current, 1);
        while (!pattern.daysOfWeek.includes(next.getDay())) {
          next = addDays(next, 1);
        }
        return next;
      }
      return addWeeks(current, pattern.interval);

    case 'monthly':
      if (pattern.dayOfMonth === 32) {
        // Last day of month
        let next = addMonths(current, pattern.interval);
        next.setDate(0); // Set to last day of previous month, then add 1 month
        return next;
      }
      return addMonths(current, pattern.interval);

    case 'yearly':
      return addYears(current, pattern.interval);

    default:
      return addDays(current, 1);
  }
}

/**
 * Check if a date matches the recurrence pattern
 */
function matchesRecurrencePattern(date: Date, pattern: RecurrencePattern): boolean {
  if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
    // Weekly recurrence - must match one of specified days
    if (!pattern.daysOfWeek.includes(date.getDay())) {
      return false;
    }
  }

  if (pattern.dayOfMonth && pattern.dayOfMonth !== 32) {
    // Monthly recurrence - must match specific day of month
    if (date.getDate() !== pattern.dayOfMonth) {
      return false;
    }
  }

  return true;
}

/**
 * Add exception date to recurrence (e.g., skip a holiday)
 */
export function addExceptionToRecurrence(
  pattern: RecurrencePattern,
  exceptionDate: string
): RecurrencePattern {
  return {
    ...pattern,
    exceptions: [...(pattern.exceptions || []), exceptionDate],
  };
}

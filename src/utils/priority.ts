import { differenceInDays, parseISO } from 'date-fns';
import { Task } from '../types/task';

/**
 * Calculate task priority based on energy level and urgency
 *
 * EISENHOWER MATRIX:
 * 
 * HIGH energy + Due soon (≤3 days) = HIGH priority
 * MEDIUM energy OR Due within week = MEDIUM priority
 * LOW energy + Due later = LOW priority
 */
export function calculateTaskPriority(
  energyLevel: Task['energyLevel'],
  dueDate: string | null | undefined
): Task['priority'] {
  if (!dueDate) {
    // No due date - priority based on energy
    return energyLevel === 'high' ? 'medium' : 'low';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = parseISO(dueDate);
  const daysUntilDue = differenceInDays(due, today);

  // HIGH PRIORITY: High energy + urgent (0-3 days)
  if (energyLevel === 'high' && daysUntilDue >= 0 && daysUntilDue <= 3) {
    return 'high';
  }

  // HIGH PRIORITY: Medium/high energy + overdue (negative days)
  if (daysUntilDue < 0) {
    return 'high';
  }

  // MEDIUM PRIORITY: Medium energy OR due within week (4-7 days)
  if (energyLevel === 'medium' || daysUntilDue <= 7) {
    return 'medium';
  }

  // LOW PRIORITY: Everything else
  return 'low';
}

/**
 * Get visual indicator for priority
 */
export function getPriorityIndicator(priority: Task['priority']): string {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
  }
}

/**
 * Get color class for priority (Tailwind)
 */
export function getPriorityColorClass(priority: Task['priority']): string {
  switch (priority) {
    case 'high':
      return 'text-red-600 border-red-300';
    case 'medium':
      return 'text-yellow-600 border-yellow-300';
    case 'low':
      return 'text-green-600 border-green-300';
  }
}

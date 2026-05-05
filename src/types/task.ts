/**
 * Main Task type - represents a single task or task instance
 */
export interface Task {
  id: string;                           // UUID v4
  title: string;
  description: string;
  status: 'pending' | 'completed';
  completedAt?: string;                 // ISO timestamp when completed
  
  // Scheduling
  dueDate: string | null;               // ISO date (YYYY-MM-DD) or null
  dueTime?: string;                     // HH:mm format for reminders
  
  // Priority & Energy System
  energyLevel: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';  // Auto-computed from energyLevel + urgency
  priorityOverride?: boolean;           // true if user manually set priority
  
  // Visual
  color?: string;                       // Hex color #RRGGBB (optional, for future)
  
  // Recurrence (mutually exclusive with parentTaskId)
  recurrence?: RecurrencePattern;
  nextOccurrence?: string;              // ISO date of next occurrence (cached)
  
  // For recurring task instances
  parentTaskId?: string;                // Points to template task
  instanceDate?: string;                // ISO date this instance is for
  
  // Reminders
  reminders: Reminder[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  
  // Sync metadata (Phase 2+)
  syncStatus: 'synced' | 'pending' | 'conflict' | 'failed';
  lastSyncedAt?: string;
  serverVersion?: number;
  localVersion: number;
}

/**
 * Reminder configuration
 */
export interface Reminder {
  id: string;
  type: 'notification';
  triggerTime: 'at_due' | '15min' | '1hour' | '1day' | 'custom';
  customMinutesBefore?: number;
  sent: boolean;
}

/**
 * Recurrence pattern for repeating tasks
 */
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;                     // Every N days/weeks/months
  endDate?: string;                     // ISO date when to stop repeating
  daysOfWeek?: number[];                // 0=Sun, 1=Mon... for weekly only
  dayOfMonth?: number;                  // For monthly (1-31, or 32 for last day)
  exceptions?: string[];                // ISO dates to skip
}

/**
 * Task filter/search criteria
 */
export interface TaskFilter {
  status?: Task['status'];
  priority?: Task['priority'];
  energyLevel?: Task['energyLevel'];
  dueDate?: string;                     // Exact date
  dueDateRange?: [string, string];      // [startDate, endDate]
  searchText?: string;
}

/**
 * Recurring task template (stored separately)
 */
export interface RecurringTaskTemplate {
  id: string;
  title: string;
  description: string;
  energyLevel: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  recurrence: RecurrencePattern;
  reminders: Reminder[];
  createdAt: string;
}

/**
 * Server-side Task DTO (snake_case wire format).
 * Mirrors the shape returned by the FastAPI backend.
 */
export interface ServerTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  completed_at: string | null;
  due_date: string | null;
  due_time: string | null;
  energy_level: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  priority_override: boolean;
  color: string | null;
  recurrence: RecurrencePattern | null;
  next_occurrence: string | null;
  parent_task_id: string | null;
  instance_date: string | null;
  reminders: Reminder[];
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

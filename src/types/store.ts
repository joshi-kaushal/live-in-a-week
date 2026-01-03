import { Task, TaskFilter, RecurringTaskTemplate } from './task';

/**
 * Complete state shape for Zustand store
 */
export interface TaskStoreState {
  // Data
  tasks: Map<string, Task>;              // taskId -> Task
  templates: Map<string, RecurringTaskTemplate>;  // templateId -> Template
  
  // UI State
  selectedTaskId?: string;               // Currently selected/opened task
  focusedDate?: string;                  // Currently focused date (YYYY-MM-DD)
  currentView: 'week' | 'month' | 'day'; // Current view mode
  commandPaletteOpen: boolean;
  quickAddOpen: boolean;
  notificationQueue: Toast[];            // Pending toasts
  
  // Filter & Search
  activeFilter?: TaskFilter;
  
  // Sync state (Phase 2)
  isSyncing: boolean;
  lastSyncedAt?: string;
  syncError?: string;
}

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;  // ms, 0 = persist until dismissed
}

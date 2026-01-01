# Live in a Week - Phase 1 Implementation Guide

## 📋 Overview

This is a detailed, step-by-step implementation guide for building **Live in a Week** - a keyboard-first, Chrome extension calendar/task management app. This guide is written for AI agents to execute precisely.

**Target:** Phase 1 MVP with Zustand state management, IndexedDB persistence, and 100% keyboard accessibility.

---

## 🎯 Phase 1 Features (In Priority Order)

1. **Task Management:** Create, complete, delete, move between dates
2. **Keyboard-First Interface:** Cmd+K for quick add, full keyboard navigation
3. **Recurring Tasks:** Daily/Weekly/Monthly with on-demand generation
4. **Priority & Energy:** Auto-computed from energy level + urgency, manually overridable
5. **Drag & Drop:** Move tasks between days (dnd-kit)
6. **Reminders & Notifications:** Chrome Alarms API
7. **Chrome Extension:** Popup quick add, home page calendar view
8. **IndexedDB:** Offline-first storage with sync preparation

---

## 📁 Project Structure to Create

```
src/
├── types/
│   ├── task.ts
│   ├── reminder.ts
│   ├── recurrence.ts
│   └── store.ts
├── store/
│   ├── taskStore.ts          (Zustand store - THE CORE)
│   ├── hooks.ts              (Custom hooks - useTasks, useTaskActions, etc)
│   └── actions.ts            (Complex actions separated)
├── services/
│   ├── indexedDB.ts          (IndexedDB operations)
│   ├── taskService.ts        (Business logic - priority calc, validation)
│   ├── recurrenceService.ts  (Recurring task generation)
│   ├── reminderService.ts    (Notification handling)
│   └── syncService.ts        (Phase 2 prep - outline only)
├── components/
│   ├── views/
│   │   ├── WeekView/
│   │   │   ├── index.tsx
│   │   │   ├── DayColumn.tsx
│   │   │   └── EmptySlot.tsx
│   │   ├── MonthView/        (Phase 2)
│   │   └── DayView/          (Phase 2)
│   ├── task/
│   │   ├── TaskCard.tsx      (Display only, keyboard accessible)
│   │   ├── TaskModal.tsx     (Edit modal - full form)
│   │   └── QuickAdd.tsx      (Cmd+K popup - minimal form)
│   ├── common/
│   │   ├── CommandPalette.tsx  (Cmd+K & Cmd+Shift+K)
│   │   ├── Toast.tsx           (Notifications)
│   │   └── ConfirmDialog.tsx    (Delete, etc)
│   ├── extension/
│   │   ├── popup.tsx         (Extension popup - quick add)
│   │   └── home.tsx          (Extension home page - calendar)
│   └── Layout.tsx            (Main layout with keyboard listeners)
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   ├── useFocusManagement.ts
│   └── useNotification.ts
├── utils/
│   ├── keyboard.ts           (Keyboard event helpers)
│   ├── date.ts               (Date utilities)
│   ├── priority.ts           (Priority calculation)
│   └── formatters.ts         (Display formatters)
├── App.tsx                   (Main app entry - updated)
├── home.tsx                  (Extension home page entry)
├── popup.tsx                 (Extension popup entry)
├── manifest.json             (Chrome extension manifest v3)
└── vite-env.d.ts
```

---

## 🔑 Core Types Definition

### File: `src/types/task.ts`

```typescript
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
```

### File: `src/types/store.ts`

```typescript
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
```

---

## 🧠 Zustand Store Setup

### File: `src/store/taskStore.ts`

This is the **CORE** of the application. All state mutations happen here.

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TaskStoreState, Toast } from '../types/store';
import { Task, RecurringTaskTemplate, TaskFilter } from '../types/task';
import { calculateTaskPriority } from '../utils/priority';
import { 
  getAllTasks, 
  getAllTemplates, 
  saveTask, 
  deleteTaskFromDB, 
  loadAllTasks,
  loadAllTemplates 
} from '../services/indexedDB';
import { v4 as uuidv4 } from 'uuid';

/**
 * Zustand store with IndexedDB persistence
 * All state mutations persist to IndexedDB automatically
 */
export const useTaskStore = create<TaskStoreState & {
  // Action Methods
  addTask: (title: string, dueDate?: string, energyLevel?: Task['energyLevel']) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  moveTaskToDate: (taskId: string, newDate: string) => Promise<void>;
  
  createRecurringTask: (template: Omit<RecurringTaskTemplate, 'id' | 'createdAt'>) => Promise<RecurringTaskTemplate>;
  deleteRecurringTask: (templateId: string) => Promise<void>;
  
  setSelectedTask: (taskId?: string) => void;
  setFocusedDate: (date?: string) => void;
  setCurrentView: (view: 'week' | 'month' | 'day') => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickAddOpen: (open: boolean) => void;
  
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  dismissNotification: (toastId: string) => void;
  
  // Query Methods
  getTasksForDate: (date: string) => Task[];
  getTasksByFilter: (filter: TaskFilter) => Task[];
  getTask: (taskId: string) => Task | undefined;
  getTasksInDateRange: (startDate: string, endDate: string) => Task[];
  
  // Initialization
  initializeStore: () => Promise<void>;
}>(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tasks: new Map(),
        templates: new Map(),
        selectedTaskId: undefined,
        focusedDate: new Date().toISOString().split('T')[0],
        currentView: 'week',
        commandPaletteOpen: false,
        quickAddOpen: false,
        notificationQueue: [],
        isSyncing: false,

        // ===== TASK ACTIONS =====

        addTask: async (title: string, dueDate?: string, energyLevel: Task['energyLevel'] = 'medium') => {
          const newTask: Task = {
            id: uuidv4(),
            title,
            description: '',
            status: 'pending',
            dueDate: dueDate || null,
            energyLevel,
            priority: calculateTaskPriority(energyLevel, dueDate),
            reminders: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending',
            localVersion: 1,
          };

          await saveTask(newTask);
          
          set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.set(newTask.id, newTask);
            return { tasks: newTasks };
          });

          get().showNotification(`Task "${title}" added`, 'success', 3000);
          return newTask;
        },

        updateTask: async (taskId: string, updates: Partial<Task>) => {
          const task = get().getTask(taskId);
          if (!task) {
            get().showNotification('Task not found', 'error');
            return;
          }

          const updatedTask: Task = {
            ...task,
            ...updates,
            id: task.id,  // Ensure ID never changes
            createdAt: task.createdAt,  // Preserve creation date
            updatedAt: new Date().toISOString(),
            localVersion: task.localVersion + 1,
            syncStatus: 'pending',
          };

          // If energy level changed and priority not manually overridden, recalculate
          if (updates.energyLevel && !updatedTask.priorityOverride) {
            updatedTask.priority = calculateTaskPriority(updatedTask.energyLevel, updatedTask.dueDate);
          }

          await saveTask(updatedTask);

          set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.set(taskId, updatedTask);
            return { tasks: newTasks };
          });
        },

        deleteTask: async (taskId: string) => {
          const task = get().getTask(taskId);
          if (!task) return;

          await deleteTaskFromDB(taskId);

          set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.delete(taskId);
            return { 
              tasks: newTasks,
              selectedTaskId: state.selectedTaskId === taskId ? undefined : state.selectedTaskId
            };
          });

          get().showNotification(`Task deleted`, 'success', 2000);
        },

        toggleTaskComplete: async (taskId: string) => {
          const task = get().getTask(taskId);
          if (!task) return;

          const isCompleting = task.status === 'pending';
          await get().updateTask(taskId, {
            status: isCompleting ? 'completed' : 'pending',
            completedAt: isCompleting ? new Date().toISOString() : undefined,
          });
        },

        moveTaskToDate: async (taskId: string, newDate: string) => {
          const task = get().getTask(taskId);
          if (!task) return;

          await get().updateTask(taskId, { dueDate: newDate });
          get().showNotification(`Task moved to ${newDate}`, 'success', 2000);
        },

        createRecurringTask: async (template: Omit<RecurringTaskTemplate, 'id' | 'createdAt'>) => {
          const recurringTemplate: RecurringTaskTemplate = {
            id: uuidv4(),
            ...template,
            createdAt: new Date().toISOString(),
          };

          // TODO: Save to IndexedDB when service ready
          set((state) => {
            const newTemplates = new Map(state.templates);
            newTemplates.set(recurringTemplate.id, recurringTemplate);
            return { templates: newTemplates };
          });

          get().showNotification('Recurring task created', 'success', 3000);
          return recurringTemplate;
        },

        deleteRecurringTask: async (templateId: string) => {
          set((state) => {
            const newTemplates = new Map(state.templates);
            newTemplates.delete(templateId);
            return { templates: newTemplates };
          });

          get().showNotification('Recurring task deleted', 'success', 2000);
        },

        // ===== UI STATE =====

        setSelectedTask: (taskId?: string) => {
          set({ selectedTaskId: taskId });
        },

        setFocusedDate: (date?: string) => {
          set({ focusedDate: date });
        },

        setCurrentView: (view: 'week' | 'month' | 'day') => {
          set({ currentView: view });
        },

        setCommandPaletteOpen: (open: boolean) => {
          set({ commandPaletteOpen: open });
        },

        setQuickAddOpen: (open: boolean) => {
          set({ quickAddOpen: open });
        },

        // ===== NOTIFICATIONS =====

        showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration = 3000) => {
          const toastId = uuidv4();
          set((state) => ({
            notificationQueue: [
              ...state.notificationQueue,
              { id: toastId, message, type, duration }
            ]
          }));

          if (duration > 0) {
            setTimeout(() => get().dismissNotification(toastId), duration);
          }
        },

        dismissNotification: (toastId: string) => {
          set((state) => ({
            notificationQueue: state.notificationQueue.filter((t) => t.id !== toastId)
          }));
        },

        // ===== QUERIES =====

        getTask: (taskId: string) => {
          return get().tasks.get(taskId);
        },

        getTasksForDate: (date: string) => {
          return Array.from(get().tasks.values()).filter(
            (task) => task.dueDate === date && task.status === 'pending'
          );
        },

        getTasksInDateRange: (startDate: string, endDate: string) => {
          return Array.from(get().tasks.values()).filter(
            (task) => task.dueDate && task.dueDate >= startDate && task.dueDate <= endDate
          );
        },

        getTasksByFilter: (filter: TaskFilter) => {
          let results = Array.from(get().tasks.values());

          if (filter.status) {
            results = results.filter((t) => t.status === filter.status);
          }
          if (filter.priority) {
            results = results.filter((t) => t.priority === filter.priority);
          }
          if (filter.energyLevel) {
            results = results.filter((t) => t.energyLevel === filter.energyLevel);
          }
          if (filter.dueDate) {
            results = results.filter((t) => t.dueDate === filter.dueDate);
          }
          if (filter.dueDateRange) {
            const [start, end] = filter.dueDateRange;
            results = results.filter((t) => t.dueDate && t.dueDate >= start && t.dueDate <= end);
          }
          if (filter.searchText) {
            const text = filter.searchText.toLowerCase();
            results = results.filter(
              (t) => t.title.toLowerCase().includes(text) || t.description.toLowerCase().includes(text)
            );
          }

          return results;
        },

        // ===== INITIALIZATION =====

        initializeStore: async () => {
          try {
            const [tasks, templates] = await Promise.all([
              loadAllTasks(),
              loadAllTemplates(),
            ]);

            const tasksMap = new Map(tasks.map((t) => [t.id, t]));
            const templatesMap = new Map(templates.map((t) => [t.id, t]));

            set({
              tasks: tasksMap,
              templates: templatesMap,
            });
          } catch (error) {
            console.error('Failed to initialize store:', error);
            get().showNotification('Failed to load tasks', 'error');
          }
        },
      }),
      {
        name: 'task-store',
        // Don't persist to localStorage - we use IndexedDB
        // But keep Zustand's subscription system
      }
    )
  )
);
```

### File: `src/store/hooks.ts`

Custom hooks for using the store in components:

```typescript
import { useMemo } from 'react';
import { useTaskStore } from './taskStore';
import { Task, TaskFilter } from '../types/task';
import { format, parseISO } from 'date-fns';

/**
 * Get all tasks for a specific date
 */
export const useTasksForDate = (date: string) => {
  return useMemo(() => {
    return useTaskStore((state) => state.getTasksForDate(date));
  }, [date, useTaskStore((state) => state.tasks)]);
};

/**
 * Get tasks in a date range (for week view, etc)
 */
export const useTasksInRange = (startDate: string, endDate: string) => {
  return useMemo(() => {
    return useTaskStore((state) => state.getTasksInDateRange(startDate, endDate));
  }, [startDate, endDate, useTaskStore((state) => state.tasks)]);
};

/**
 * Get filtered tasks
 */
export const useFilteredTasks = (filter: TaskFilter) => {
  return useMemo(() => {
    return useTaskStore((state) => state.getTasksByFilter(filter));
  }, [filter, useTaskStore((state) => state.tasks)]);
};

/**
 * Get a specific task
 */
export const useTask = (taskId?: string) => {
  return useMemo(() => {
    if (!taskId) return undefined;
    return useTaskStore((state) => state.getTask(taskId));
  }, [taskId, useTaskStore((state) => state.tasks)]);
};

/**
 * Actions hook - stable reference for all task mutations
 */
export const useTaskActions = () => {
  return useMemo(
    () => ({
      addTask: useTaskStore((state) => state.addTask),
      updateTask: useTaskStore((state) => state.updateTask),
      deleteTask: useTaskStore((state) => state.deleteTask),
      toggleComplete: useTaskStore((state) => state.toggleTaskComplete),
      moveTaskToDate: useTaskStore((state) => state.moveTaskToDate),
      createRecurringTask: useTaskStore((state) => state.createRecurringTask),
      deleteRecurringTask: useTaskStore((state) => state.deleteRecurringTask),
    }),
    []
  );
};

/**
 * UI state hook
 */
export const useUIState = () => {
  return useMemo(
    () => ({
      selectedTaskId: useTaskStore((state) => state.selectedTaskId),
      setSelectedTask: useTaskStore((state) => state.setSelectedTask),
      focusedDate: useTaskStore((state) => state.focusedDate),
      setFocusedDate: useTaskStore((state) => state.setFocusedDate),
      currentView: useTaskStore((state) => state.currentView),
      setCurrentView: useTaskStore((state) => state.setCurrentView),
      commandPaletteOpen: useTaskStore((state) => state.commandPaletteOpen),
      setCommandPaletteOpen: useTaskStore((state) => state.setCommandPaletteOpen),
      quickAddOpen: useTaskStore((state) => state.quickAddOpen),
      setQuickAddOpen: useTaskStore((state) => state.setQuickAddOpen),
    }),
    []
  );
};

/**
 * Notifications hook
 */
export const useNotifications = () => {
  return useMemo(
    () => ({
      notifications: useTaskStore((state) => state.notificationQueue),
      showNotification: useTaskStore((state) => state.showNotification),
      dismissNotification: useTaskStore((state) => state.dismissNotification),
    }),
    []
  );
};
```

---

## 💾 IndexedDB Service

### File: `src/services/indexedDB.ts`

All IndexedDB operations in one service. Uses `idb` library.

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task, RecurringTaskTemplate } from '../types/task';

// Define schema
interface TaskDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-dueDate': string;
      'by-status': string;
    };
  };
  templates: {
    key: string;
    value: RecurringTaskTemplate;
  };
}

const DB_NAME = 'live-in-a-week';
const DB_VERSION = 1;

let db: IDBPDatabase<TaskDB> | null = null;

/**
 * Initialize IndexedDB connection
 */
export async function initDB(): Promise<IDBPDatabase<TaskDB>> {
  if (db) return db;

  db = await openDB<TaskDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-dueDate', 'dueDate');
        taskStore.createIndex('by-status', 'status');
      }

      // Create templates store
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
    },
  });

  return db;
}

// ===== TASK OPERATIONS =====

export async function saveTask(task: Task): Promise<void> {
  const database = await initDB();
  await database.put('tasks', task);
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('tasks', 'readwrite');
  for (const task of tasks) {
    await tx.store.put(task);
  }
  await tx.done;
}

export async function getTask(id: string): Promise<Task | undefined> {
  const database = await initDB();
  return await database.get('tasks', id);
}

export async function getAllTasks(): Promise<Task[]> {
  const database = await initDB();
  return await database.getAll('tasks');
}

export async function deleteTaskFromDB(id: string): Promise<void> {
  const database = await initDB();
  await database.delete('tasks', id);
}

export async function getTasksByDueDate(date: string): Promise<Task[]> {
  const database = await initDB();
  return await database.getAllFromIndex('tasks', 'by-dueDate', date);
}

export async function getTasksByStatus(status: 'pending' | 'completed'): Promise<Task[]> {
  const database = await initDB();
  return await database.getAllFromIndex('tasks', 'by-status', status);
}

// ===== TEMPLATE OPERATIONS =====

export async function saveTemplate(template: RecurringTaskTemplate): Promise<void> {
  const database = await initDB();
  await database.put('templates', template);
}

export async function getTemplate(id: string): Promise<RecurringTaskTemplate | undefined> {
  const database = await initDB();
  return await database.get('templates', id);
}

export async function getAllTemplates(): Promise<RecurringTaskTemplate[]> {
  const database = await initDB();
  return await database.getAll('templates');
}

export async function deleteTemplate(id: string): Promise<void> {
  const database = await initDB();
  await database.delete('templates', id);
}

// ===== BULK OPERATIONS =====

export async function loadAllTasks(): Promise<Task[]> {
  return getAllTasks();
}

export async function loadAllTemplates(): Promise<RecurringTaskTemplate[]> {
  return getAllTemplates();
}

export async function clearAllData(): Promise<void> {
  const database = await initDB();
  const tx = database.transaction(['tasks', 'templates'], 'readwrite');
  await tx.objectStore('tasks').clear();
  await tx.objectStore('templates').clear();
  await tx.done;
}
```

---

## 🎯 Priority Calculation

### File: `src/utils/priority.ts`

Auto-compute priority from energy level + due date urgency:

```typescript
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
```

---

## 🔄 Recurrence Service

### File: `src/services/recurrenceService.ts`

Generate recurring task instances on-demand:

```typescript
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
```

---

## 🔔 Reminder Service

### File: `src/services/reminderService.ts`

Handle Chrome notifications using Alarms API:

```typescript
import { Task, Reminder } from '../types/task';
import { parseISO, differenceInMinutes } from 'date-fns';

/**
 * Schedule Chrome alarms for task reminders
 * Call this when a task is created/updated with reminders
 */
export async function scheduleReminders(task: Task): Promise<void> {
  if (!task.reminders || task.reminders.length === 0 || !task.dueDate || !task.dueTime) {
    return;
  }

  for (const reminder of task.reminders) {
    if (reminder.sent) continue; // Don't reschedule sent reminders

    const alarmName = `reminder-${task.id}-${reminder.id}`;
    const triggerTime = calculateTriggerTime(task.dueDate, task.dueTime, reminder);

    if (triggerTime) {
      chrome.alarms.create(alarmName, {
        when: triggerTime.getTime(),
      });
    }
  }
}

/**
 * Calculate when reminder should trigger
 */
function calculateTriggerTime(
  dueDate: string,
  dueTime: string,
  reminder: Reminder
): Date | null {
  const [hours, minutes] = dueTime.split(':').map(Number);
  const due = parseISO(dueDate);
  due.setHours(hours, minutes, 0, 0);

  let triggerTime = new Date(due);

  switch (reminder.triggerTime) {
    case 'at_due':
      return due;
    case '15min':
      triggerTime.setMinutes(triggerTime.getMinutes() - 15);
      break;
    case '1hour':
      triggerTime.setHours(triggerTime.getHours() - 1);
      break;
    case '1day':
      triggerTime.setDate(triggerTime.getDate() - 1);
      break;
    case 'custom':
      if (reminder.customMinutesBefore) {
        triggerTime.setMinutes(triggerTime.getMinutes() - reminder.customMinutesBefore);
      }
      break;
  }

  // Don't schedule if in past
  if (triggerTime < new Date()) {
    return null;
  }

  return triggerTime;
}

/**
 * Cancel reminder alarms
 */
export async function cancelReminders(taskId: string): Promise<void> {
  const alarms = await chrome.alarms.getAll();
  const taskAlarms = alarms.filter((a) => a.name.startsWith(`reminder-${taskId}`));

  for (const alarm of taskAlarms) {
    chrome.alarms.clear(alarm.name);
  }
}

/**
 * Send notification for reminder
 * Call from service worker when alarm fires
 */
export async function sendNotification(taskId: string, taskTitle: string): Promise<void> {
  chrome.notifications.create(`reminder-${taskId}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('images/icon-128.png'),
    title: 'Task Reminder',
    message: taskTitle,
    priority: 2,
    buttons: [
      { title: 'Complete' },
      { title: 'Snooze' },
    ],
  });
}
```

---

## ⌨️ Keyboard Accessibility System

### File: `src/utils/keyboard.ts`

Keyboard event helpers:

```typescript
export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac
};

/**
 * Check if keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return (
    event.key === shortcut.key &&
    !!event.ctrlKey === !!shortcut.ctrl &&
    !!event.shiftKey === !!shortcut.shift &&
    !!event.altKey === !!shortcut.alt &&
    !!event.metaKey === !!shortcut.meta
  );
}

/**
 * Prevent default if shortcut matches
 */
export function handleShortcutDefault(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  if (matchesShortcut(event, shortcut)) {
    event.preventDefault();
    return true;
  }
  return false;
}

/**
 * Keyboard shortcuts for the app
 */
export const SHORTCUTS = {
  QUICK_ADD: { key: 'k', meta: true, ctrl: true } as KeyboardShortcut,        // Cmd+K (Mac) / Ctrl+K (Windows)
  COMMAND_PALETTE: { key: 'k', shift: true, meta: true, ctrl: true } as KeyboardShortcut,  // Cmd+Shift+K / Ctrl+Shift+K
  COMPLETE_TASK: { key: 'd', meta: true, ctrl: true } as KeyboardShortcut,     // Cmd+D / Ctrl+D
  DELETE_TASK: { key: 'Delete' } as KeyboardShortcut,
  ESCAPE: { key: 'Escape' } as KeyboardShortcut,
  ENTER: { key: 'Enter' } as KeyboardShortcut,
  TAB: { key: 'Tab' } as KeyboardShortcut,
  ARROW_LEFT: { key: 'ArrowLeft' } as KeyboardShortcut,
  ARROW_RIGHT: { key: 'ArrowRight' } as KeyboardShortcut,
  ARROW_UP: { key: 'ArrowUp' } as KeyboardShortcut,
  ARROW_DOWN: { key: 'ArrowDown' } as KeyboardShortcut,
};
```

### File: `src/hooks/useKeyboardShortcuts.ts`

Custom hook for handling keyboard shortcuts:

```typescript
import { useEffect, useCallback } from 'react';
import { SHORTCUTS, matchesShortcut } from '../utils/keyboard';

interface KeyboardShortcutsConfig {
  onQuickAdd?: () => void;
  onCommandPalette?: () => void;
  onCompleteTask?: () => void;
  onDeleteTask?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
}

/**
 * Hook for handling global keyboard shortcuts
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts while typing in input unless it's the slash command
      const isInput = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName);

      if (matchesShortcut(event, SHORTCUTS.QUICK_ADD)) {
        event.preventDefault();
        config.onQuickAdd?.();
      } else if (matchesShortcut(event, SHORTCUTS.COMMAND_PALETTE)) {
        event.preventDefault();
        config.onCommandPalette?.();
      } else if (!isInput) {
        if (matchesShortcut(event, SHORTCUTS.COMPLETE_TASK)) {
          event.preventDefault();
          config.onCompleteTask?.();
        } else if (matchesShortcut(event, SHORTCUTS.DELETE_TASK)) {
          event.preventDefault();
          config.onDeleteTask?.();
        } else if (matchesShortcut(event, SHORTCUTS.ESCAPE)) {
          config.onEscape?.();
        }
      }

      if (matchesShortcut(event, SHORTCUTS.ENTER)) {
        config.onEnter?.();
      }
    },
    [config]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

---

## 🧩 Core Components

### File: `src/components/task/TaskCard.tsx`

Simple, keyboard-accessible task display:

```typescript
import React, { useRef, useEffect } from 'react';
import { Task } from '../../types/task';
import { getPriorityIndicator, getPriorityColorClass } from '../../utils/priority';
import { format, parseISO } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onSelect: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  isFocused?: boolean;
  isDragging?: boolean;
}

export const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onSelect, onComplete, isFocused, isDragging }, ref) => {
    const checkboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isFocused) {
        ref && 'current' in ref && ref.current?.focus();
      }
    }, [isFocused, ref]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        onComplete(task.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(task.id);
      }
    };

    return (
      <div
        ref={ref}
        className={`
          flex items-center gap-2 p-2 mb-1 rounded border-l-4
          ${getPriorityColorClass(task.priority)}
          ${task.status === 'completed' ? 'bg-gray-100 opacity-60' : 'bg-white hover:bg-gray-50'}
          ${isFocused ? 'ring-2 ring-blue-400' : ''}
          ${isDragging ? 'opacity-50' : ''}
          cursor-pointer transition-all
        `}
        tabIndex={0}
        role="button"
        aria-label={`${task.title} - ${task.status === 'completed' ? 'Completed' : 'Pending'}`}
        onKeyDown={handleKeyDown}
        onClick={() => onSelect(task.id)}
      >
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={() => onComplete(task.id)}
          className="cursor-pointer"
          aria-label={`Toggle completion for ${task.title}`}
        />

        <span
          className={`flex-grow text-sm ${
            task.status === 'completed' ? 'line-through text-gray-400' : ''
          }`}
        >
          {task.title}
        </span>

        <span className="text-lg" aria-label={`Priority: ${task.priority}`}>
          {getPriorityIndicator(task.priority)}
        </span>

        {task.energyLevel && (
          <span
            className="text-xs px-2 py-1 rounded bg-gray-100"
            aria-label={`Energy level: ${task.energyLevel}`}
          >
            {task.energyLevel[0].toUpperCase()}
          </span>
        )}
      </div>
    );
  }
);

TaskCard.displayName = 'TaskCard';
```

### File: `src/components/task/QuickAdd.tsx`

Quick task creation modal (Cmd+K):

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useTaskActions } from '../../store/hooks';
import { Task } from '../../types/task';

interface QuickAddProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export const QuickAdd: React.FC<QuickAddProps> = ({ isOpen, onClose, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [energyLevel, setEnergyLevel] = useState<Task['energyLevel']>('medium');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { addTask } = useTaskActions();

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addTask(title.trim(), defaultDate, energyLevel);
    setTitle('');
    setEnergyLevel('medium');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50"
      role="dialog"
      aria-labelledby="quick-add-title"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
        <h2 id="quick-add-title" className="text-lg font-semibold mb-4">
          Quick Add Task
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title (Tab for more options)"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Task title"
            />
          </div>

          {showAdvanced && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Energy Level</label>
                <select
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(e.target.value as Task['energyLevel'])}
                  className="w-full px-3 py-2 border rounded"
                  aria-label="Energy level"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              {showAdvanced ? 'Less' : 'More'} Options
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### File: `src/components/views/WeekView/index.tsx`

Main week view component:

```typescript
import React, { useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { useTasksInRange, useTaskActions, useUIState } from '../../store/hooks';
import { DayColumn } from './DayColumn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const WeekView: React.FC = () => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const { focusedDate, setFocusedDate } = useUIState();
  const { moveTaskToDate } = useTaskActions();

  const weekEnd = addDays(weekStart, 6);
  const weekTasks = useTasksInRange(
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => {
    const newStart = addDays(weekStart, -7);
    setWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = addDays(weekStart, 7);
    setWeekStart(newStart);
  };

  return (
    <div className="w-full">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {format(weekStart, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-4">
        {days.map((day, index) => (
          <DayColumn
            key={index}
            date={day}
            tasks={weekTasks.filter((t) => t.dueDate === format(day, 'yyyy-MM-dd'))}
            isFocused={focusedDate === format(day, 'yyyy-MM-dd')}
            onFocus={() => setFocusedDate(format(day, 'yyyy-MM-dd'))}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 📱 Chrome Extension Setup

### File: `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Live in a Week",
  "version": "0.0.1",
  "description": "A keyboard-first weekly planner and task management extension",
  "permissions": [
    "storage",
    "alarms",
    "notifications"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Quick Add Task (Cmd+K)"
  },
  "chrome_url_overrides": {
    "newtab": "home.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "web_accessible_resources": [
    {
      "resources": ["images/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

---

## 📋 Implementation Order

**Phase 1 Implementation Steps (Execute in this order):**

1. **Setup & Dependencies**
   - Install: `zustand`, `idb`, `uuid`, `date-fns`, `dnd-kit`
   - Update `package.json`

2. **Type Definitions** (No component dependencies)
   - Create `src/types/task.ts`
   - Create `src/types/store.ts`
   - Create `src/types/reminder.ts`

3. **Utilities** (Pure functions, no dependencies)
   - Create `src/utils/priority.ts`
   - Create `src/utils/keyboard.ts`
   - Create `src/utils/date.ts`

4. **IndexedDB Service**
   - Create `src/services/indexedDB.ts`

5. **Zustand Store** (Depends on types + indexedDB)
   - Create `src/store/taskStore.ts`
   - Create `src/store/hooks.ts`

6. **Business Logic Services**
   - Create `src/services/taskService.ts`
   - Create `src/services/recurrenceService.ts`
   - Create `src/services/reminderService.ts`

7. **Custom Hooks**
   - Create `src/hooks/useKeyboardShortcuts.ts`
   - Create `src/hooks/useFocusManagement.ts`

8. **Components** (Depends on store, hooks, services)
   - Create `src/components/task/TaskCard.tsx`
   - Create `src/components/task/QuickAdd.tsx`
   - Create `src/components/task/TaskModal.tsx`
   - Create `src/components/views/WeekView/index.tsx`
   - Create `src/components/views/WeekView/DayColumn.tsx`

9. **Layout & App**
   - Update `src/App.tsx`
   - Create `src/Layout.tsx` with keyboard shortcuts
   - Create `src/home.tsx` (extension home page)
   - Create `src/popup.tsx` (extension popup)

10. **Extension Files**
    - Create `manifest.json`
    - Create `background.js` (service worker for reminders)

11. **Testing & Polish**
    - Test keyboard accessibility (Tab, Cmd+K, arrows, etc)
    - Test IndexedDB persistence
    - Test recurring tasks
    - Test reminders

---

## ✅ Phase 1 Checklist

- [ ] All type definitions created
- [ ] Zustand store working with IndexedDB
- [ ] Task CRUD operations functional
- [ ] Cmd+K quick add working
- [ ] Priority auto-calculation working
- [ ] Keyboard navigation fully accessible
- [ ] Week view displaying tasks correctly
- [ ] Drag & drop between days functional
- [ ] Recurring task generation working
- [ ] Reminders scheduling & notifications working
- [ ] Chrome extension manifest & entry points
- [ ] All keyboard shortcuts tested
- [ ] Focus management working (Tab navigation)
- [ ] ARIA labels & screen reader support

---

## 🎯 Success Criteria for Phase 1

✅ User can create task with Cmd+K in < 5 seconds
✅ User can navigate entire app with keyboard only
✅ Tasks persist across page refreshes (IndexedDB)
✅ Recurring tasks generate correctly
✅ Reminders fire at correct time
✅ All priority calculations correct
✅ Chrome extension loads without errors
✅ WCAG AA accessibility compliance
✅ No JavaScript errors in console
✅ 0 missing dependencies

---

## 📝 Notes for Implementation

1. **Zustand DevTools:** Built-in for debugging state changes
2. **IndexedDB:** Automatically initialized on first use
3. **Keyboard Shortcuts:** Centralized in `SHORTCUTS` object - easy to modify
4. **Type Safety:** Full TypeScript coverage - use strict mode
5. **Accessibility:** All interactive elements must have keyboard support + ARIA labels
6. **Testing:** Use browser DevTools to inspect IndexedDB directly
7. **Extensions:** Use `idb` library instead of raw IndexedDB for cleaner code

---

This guide is complete and ready for step-by-step implementation. Each section provides exactly what's needed to execute that feature without guesswork.

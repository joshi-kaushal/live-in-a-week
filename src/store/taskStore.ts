import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TaskStoreState } from '../types/store';
import { Task, RecurringTaskTemplate, TaskFilter } from '../types/task';
import { calculateTaskPriority } from '../utils/priority';
import {
  saveTask,
  deleteTaskFromDB,
  loadAllTasks,
  loadAllTemplates
} from '../services/chromeStorage';
import { tasksApi, ApiError } from '../services/api';
import { useAuthStore } from './authStore';
import { v4 as uuidv4 } from 'uuid';

const isAuthed = () => !!useAuthStore.getState().token;

type StoreState = TaskStoreState & {
  // Action Methods
  addTask: (title: string, dueDate?: string, energyLevel?: Task['energyLevel']) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  duplicateTask: (taskId: string) => Promise<Task>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  moveTaskToDate: (taskId: string, newDate: string) => Promise<void>;
  
  createRecurringTask: (template: Omit<RecurringTaskTemplate, 'id' | 'createdAt'>) => Promise<RecurringTaskTemplate>;
  deleteRecurringTask: (templateId: string) => Promise<void>;

  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  
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
}
/**
 * Zustand store with IndexedDB persistence
 * All state mutations persist to IndexedDB automatically
 */
export const useTaskStore = create<StoreState>()(
  persist(
    devtools(
      (set, get) => ({
        // Initial state
        tasks: new Map<string, Task>(),
        templates: new Map<string, RecurringTaskTemplate>(),
        selectedTaskId: undefined,
        focusedDate: new Date().toISOString().split('T')[0],
        currentView: 'week' as const,
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
            dueDate: dueDate ? dueDate : null,
            energyLevel,
            priority: calculateTaskPriority(energyLevel, dueDate),
            reminders: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: isAuthed() ? 'pending' : 'synced',
            localVersion: 1,
          };

          // Optimistic insert
          set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.set(newTask.id, newTask);
            return { tasks: newTasks };
          });

          if (isAuthed()) {
            try {
              const serverTask = await tasksApi.create(newTask);
              set((state) => {
                const newTasks = new Map(state.tasks);
                newTasks.set(serverTask.id, serverTask);
                return { tasks: newTasks };
              });
              get().showNotification(`Task "${title}" added`, 'success', 3000);
              return serverTask;
            } catch (e) {
              // Rollback
              set((state) => {
                const newTasks = new Map(state.tasks);
                newTasks.delete(newTask.id);
                return { tasks: newTasks };
              });
              const msg = e instanceof Error ? e.message : 'Failed to create task';
              get().showNotification(`Couldn't save: ${msg}`, 'error', 4000);
              throw e;
            }
          }

          await saveTask(newTask);
          get().showNotification(`Task "${title}" added`, 'success', 3000);
          return newTask;
        },

        updateTask: async (taskId: string, updates: Partial<Task>) => {
          const task = get().getTask(taskId);
          if (!task) {
            get().showNotification('Task not found', 'error');
            return;
          }

          const optimistic: Task = {
            ...task,
            ...updates,
            id: task.id,
            createdAt: task.createdAt,
            updatedAt: new Date().toISOString(),
            localVersion: (task.localVersion ?? 0) + 1,
            syncStatus: isAuthed() ? 'pending' : 'synced',
          };

          if (updates.energyLevel && !optimistic.priorityOverride) {
            optimistic.priority = calculateTaskPriority(optimistic.energyLevel, optimistic.dueDate ?? undefined);
          }

          // The effective patch sent to server: caller's updates + any recalculated priority
          const patch: Partial<Task> = { ...updates };
          if (optimistic.priority !== task.priority) {
            patch.priority = optimistic.priority;
          }

          set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.set(taskId, optimistic);
            return { tasks: newTasks };
          });

          if (isAuthed()) {
            try {
              const serverTask = await tasksApi.update(taskId, patch, task.serverVersion ?? task.localVersion ?? 1);
              set((state) => {
                const newTasks = new Map(state.tasks);
                newTasks.set(taskId, serverTask);
                return { tasks: newTasks };
              });
            } catch (e) {
              // Rollback
              set((state) => {
                const newTasks = new Map(state.tasks);
                newTasks.set(taskId, task);
                return { tasks: newTasks };
              });
              if (e instanceof ApiError && e.status === 409) {
                get().showNotification('Task changed on another device — refreshing', 'warning', 4000);
                try {
                  const fresh = await tasksApi.list();
                  const found = fresh.find((t) => t.id === taskId);
                  if (found) {
                    set((state) => {
                      const newTasks = new Map(state.tasks);
                      newTasks.set(taskId, found);
                      return { tasks: newTasks };
                    });
                  }
                } catch { /* ignore */ }
              } else {
                const msg = e instanceof Error ? e.message : 'Failed to update task';
                get().showNotification(`Couldn't save: ${msg}`, 'error', 4000);
              }
              throw e;
            }
            return;
          }

          await saveTask(optimistic);
        },

        deleteTask: async (taskId: string) => {
          const task = get().getTask(taskId);
          if (!task) return;

          // Optimistic removal
          set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.delete(taskId);
            return {
              tasks: newTasks,
              selectedTaskId: state.selectedTaskId === taskId ? undefined : state.selectedTaskId
            };
          });

          if (isAuthed()) {
            try {
              await tasksApi.remove(taskId);
              get().showNotification(`Task deleted`, 'success', 2000);
            } catch (e) {
              // Rollback
              set((state) => {
                const newTasks = new Map(state.tasks);
                newTasks.set(taskId, task);
                return { tasks: newTasks };
              });
              const msg = e instanceof Error ? e.message : 'Failed to delete task';
              get().showNotification(`Couldn't delete: ${msg}`, 'error', 4000);
              throw e;
            }
            return;
          }

          await deleteTaskFromDB(taskId);
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

        duplicateTask: async (taskId: string) => {
          const task = get().getTask(taskId);
          if (!task) {
            get().showNotification('Task not found', 'error');
            throw new Error('Task not found');
          }

          const duplicate: Task = {
            ...task,
            id: uuidv4(),
            status: 'pending',
            completedAt: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            localVersion: 1,
            syncStatus: isAuthed() ? 'pending' : 'synced',
          };

          set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.set(duplicate.id, duplicate);
            return { tasks: newTasks };
          });

          if (isAuthed()) {
            try {
              const serverTask = await tasksApi.create(duplicate);
              set((state) => {
                const newTasks = new Map(state.tasks);
                newTasks.set(serverTask.id, serverTask);
                return { tasks: newTasks };
              });
              get().showNotification(`"${task.title}" duplicated`, 'success', 2500);
              return serverTask;
            } catch (e) {
              set((state) => {
                const newTasks = new Map(state.tasks);
                newTasks.delete(duplicate.id);
                return { tasks: newTasks };
              });
              const msg = e instanceof Error ? e.message : 'Failed to duplicate task';
              get().showNotification(`Couldn't duplicate: ${msg}`, 'error', 4000);
              throw e;
            }
          }

          await saveTask(duplicate);
          get().showNotification(`"${task.title}" duplicated`, 'success', 2500);
          return duplicate;
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

        setSelectedTask: (taskId?: string) => set({ selectedTaskId: taskId }),
        setFocusedDate: (date?: string) => set({ focusedDate: date }),
        setCurrentView: (view: 'week' | 'month' | 'day') => set({ currentView: view }),
        setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
        setQuickAddOpen: (open: boolean) => set({ quickAddOpen: open }),

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

        getTask: (taskId: string) => get().tasks.get(taskId),

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

        // ===== AUTH TRANSITIONS =====

        onLogin: async () => {
          const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;
          const MIGRATION_KEY = 'tasks_migrated_to_server';

          try {
            const flag = storage ? await storage.get(MIGRATION_KEY) as { [k: string]: boolean } : {};
            const alreadyMigrated = !!flag[MIGRATION_KEY];

            if (!alreadyMigrated) {
              const localTasks = await loadAllTasks();
              if (localTasks.length > 0) {
                const tally = await tasksApi.bulkPush(localTasks);
                get().showNotification(
                  `Synced ${tally.accepted} task${tally.accepted === 1 ? '' : 's'} to cloud${tally.conflicts ? ` (${tally.conflicts} conflicts)` : ''}`,
                  'success',
                  4000
                );
              }
              if (storage) await storage.set({ [MIGRATION_KEY]: true });
            }

            // Now switch to server-as-source-of-truth
            const tasks = await tasksApi.list();
            const tasksMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
            set({ tasks: tasksMap });
          } catch (e) {
            console.error('Login migration failed:', e);
            const msg = e instanceof Error ? e.message : 'Unknown error';
            get().showNotification(`Login sync failed: ${msg}`, 'error', 5000);
          }
        },

        onLogout: async () => {
          // Caller (logout modal) wipes chrome.storage. Here we just clear in-memory state.
          set({
            tasks: new Map<string, Task>(),
            templates: new Map<string, RecurringTaskTemplate>(),
            selectedTaskId: undefined,
          });
        },

        // ===== INITIALIZATION =====

        initializeStore: async () => {
          try {
            const templates = await loadAllTemplates();
            const templatesMap = new Map<string, RecurringTaskTemplate>(templates.map((t) => [t.id, t]));

            let tasks: Task[];
            if (isAuthed()) {
              try {
                tasks = await tasksApi.list();
              } catch (e) {
                console.error('Failed to fetch tasks from server:', e);
                get().showNotification('Could not reach server — showing cached tasks', 'warning', 4000);
                tasks = await loadAllTasks();
              }
            } else {
              tasks = await loadAllTasks();
            }

            const tasksMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
            set({ tasks: tasksMap, templates: templatesMap });
          } catch (error) {
            console.error('Failed to initialize store:', error);
            get().showNotification('Failed to load tasks', 'error');
          }
        },
      }),
    ),
    {
      name: 'task-store',
      skipHydration: true,
      storage: {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
      },
    }
  )

);